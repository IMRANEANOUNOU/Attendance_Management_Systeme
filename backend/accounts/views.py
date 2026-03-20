from django.contrib.auth import authenticate
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.db.models import Count, Q
from schedule.models import Seance
from attendance.models import Pointage, PresenceProf
from .permissions import IsAdminRole, IsProfesseur
from .models import Utilisateur, Etudiant, Professeur
from rest_framework.authtoken.models import Token
from .serializers import UtilisateurSerializer, EtudiantSerializer, ProfesseurSerializer
from django.db import transaction
from academic.models import Groupe, Departement , Filiere
from rest_framework.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.conf import settings
@api_view(['GET'])
@permission_classes([IsAdminRole])
def get_utilisateurs(request):
    utilisateurs = Utilisateur.objects.all()
    rep = UtilisateurSerializer(utilisateurs, many=True)
    return Response(rep.data)
@api_view(['GET'])
@permission_classes([IsProfesseur | IsAdminRole])
def get_etudiants(request):
    etudiant = Etudiant.objects.select_related('user', 'groupe', 'filiere__departement').annotate(
        nb_absences=Count('user__pointages', filter=Q(user__pointages__status='ABSENT'), distinct=True),
        nb_absences_justifiees=Count('user__pointages', filter=Q(user__pointages__status='ABSENT', user__pointages__justification__etat='APPROUVE'), distinct=True),
    ).all()
    rep = EtudiantSerializer(etudiant, many=True)
    return Response(rep.data)
@api_view(['GET'])
@permission_classes([IsAdminRole | IsProfesseur])
def get_professeur(request):
    prof = Professeur.objects.prefetch_related('modules__filiere').all()
    rep = ProfesseurSerializer(prof, many=True)
    return Response(rep.data)
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    try:
        email = request.data.get('email') or (request.POST.get('email') if hasattr(request, 'POST') else None)
        password = request.data.get('password') or (request.POST.get('password') if hasattr(request, 'POST') else None)
        if not email or not password:
            return Response({"error": "Veuillez saisir votre email et votre mot de passe"}, status=status.HTTP_400_BAD_REQUEST)
        user = authenticate(request, email=email.strip(), password=password)
        if user is None:
            err = "Email ou mot de passe incorrect"
            try:
                u = Utilisateur.objects.filter(email__iexact=email.strip()).first()
                if u:
                    if not u.is_active:
                        err = "Ce compte est désactivé."
                    else:
                        err = "Mot de passe incorrect."
                else:
                    err = "Aucun compte avec cet email."
            except Exception:
                pass
            return Response({"error": err}, status=status.HTTP_401_UNAUTHORIZED)
        token, _ = Token.objects.get_or_create(user=user)
        data = {
            'token': token.key,
            'id': user.id,
            'email': user.email,
            'role': user.role,
            'full_name': f"{(user.last_name or '')} {(user.first_name or '')}".strip() or user.email,
            'is_first_login': user.is_first_login,
        }
        # Add extra flags depending on role
        if user.role == Utilisateur.Role.PROF:
            try:
                prof = user.prof_profile
                # Chef de département ?
                from academic.models import Departement, Filiere  # local import to avoid cycles
                try:
                    dep = Departement.objects.filter(chef=prof).first()
                except Exception:
                    dep = None
                try:
                    fil = Filiere.objects.filter(chef=prof).first()
                except Exception:
                    fil = None

                data["is_chef_departement"] = bool(dep)
                data["is_chef_filiere"] = bool(fil)
                if dep:
                    data["departement_id"] = dep.id
                if fil:
                    data["filiere_id"] = fil.id
            except Professeur.DoesNotExist:
                pass
            except Exception:
                pass
        elif user.role == Utilisateur.Role.ETUDIANT:
            try:
                ep = user.etudiant_profile
                if ep.photo_profile:
                    data['photo'] = ep.photo_profile.url
            except Exception:
                pass
        return Response(data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"FATAL ERROR": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
def register_user(data,role):
    email=data.get('email')
    passwd=data.get('password')
    if not email:
        raise ValidationError({"email": "email is required"})
    if Utilisateur.objects.filter(email=email).exists():
        raise ValidationError({"email": "Email already exists"})
    if not passwd:
        raise ValidationError({"passwd": "password is required"})
    first_name=data.get('first_name',email.split('@')[0] if '@' in email else email)
    last_name=data.get('last_name',email.split('@')[0] if '@' in email else email)
    return Utilisateur.objects.create_user(
                username=email,
                email=email,
                password=passwd,
                first_name=first_name,
                last_name=last_name,
                role=role
            )
@api_view(['POST'])
@permission_classes([IsAdminRole])
def register_etudiant(request):
    data=request.data
    try:
        with transaction.atomic():
            user=register_user(data,Utilisateur.Role.ETUDIANT)
            if not data.get('cne'):
                raise ValidationError({"cne": "CNE is required"})

            if not data.get('filiere_id'):
                raise ValidationError({"filiere_id": "La filière est obligatoire"})

            try:
                fil = Filiere.objects.get(id=data['filiere_id'])
            except Filiere.DoesNotExist:
                return Response({"filiere_id": "Filière invalide"}, status=status.HTTP_400_BAD_REQUEST)
            
            grp = None
            if 'groupe_id' in data and data['groupe_id']:
                try:
                    grp = Groupe.objects.get(id=data['groupe_id'])
                    if grp.filiere != fil:
                         return Response({"error": "Ce groupe n'appartient pas à la filière sélectionnée"}, status=status.HTTP_400_BAD_REQUEST)
                except Groupe.DoesNotExist:
                    return Response({"groupe_id": "Groupe invalide"}, status=status.HTTP_400_BAD_REQUEST)
            
            Etudiant.objects.create(
                user=user,
                cne=data['cne'],
                date_naissance=data.get('date_naissance'),
                adresse=data.get('adresse'),
                groupe=grp,
                filiere=fil,
                photo_profile=request.FILES.get('photo_profile')
            )
        return Response({"message": "Compte etudiant cree avec succes"}, status=status.HTTP_201_CREATED)
    except ValidationError as e:
        return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)
    except Groupe.DoesNotExist:
        return Response({"groupe": "Invalid group"}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"error": "Internal server error"}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAdminRole])
def register_professeur(request):
    data=request.data
    try:
        with transaction.atomic():
            user=register_user(data,Utilisateur.Role.PROF)
            if not data.get('matricule'):
                raise ValidationError({"matricule": "matricule is required"})

            dep = None
            if 'departement_id' in data and data['departement_id']:
                dep = Departement.objects.get(id=data['departement_id'])
            Professeur.objects.create(
                user=user,
                matricule=data['matricule'],
                specialite=data.get('specialite'),
                departement=dep
            )
        return Response({"message": "Compte professeur cree avec succes"}, status=status.HTTP_201_CREATED)
    except ValidationError as e:
        return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)
    except Departement.DoesNotExist:
        return Response({"departement": "Invalid departement"}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"error": "Internal server error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
@api_view(['PUT'])
@permission_classes([IsAdminRole])
def update_user(request,id):
    data=request.data
    files=request.FILES
    try:
        with transaction.atomic():
            user=Utilisateur.objects.get(id=id)
            for f in ['first_name','last_name','email']:
                if f in data:
                    setattr(user,f,data[f])
            user.save()
            if user.role==Utilisateur.Role.ETUDIANT:
                et=user.etudiant_profile
                for f in ['adresse','cne']:
                    if f in data:
                        setattr(et,f,data[f])
                
                if 'filiere_id' in data:
                    try:
                        filiere = Filiere.objects.get(id=data['filiere_id'])
                        et.filiere = filiere
                    except Filiere.DoesNotExist:
                        return Response({"error": "Filiere invalid"}, status=status.HTTP_400_BAD_REQUEST)

                if 'groupe_id' in data:
                    try:
                        groupe=Groupe.objects.get(id=data['groupe_id'])
                        if et.filiere and groupe.filiere != et.filiere:
                             return Response({"error": "Le groupe n'appartient pas à la filière de l'étudiant"}, status=status.HTTP_400_BAD_REQUEST)
                        et.groupe=groupe
                    except Groupe.DoesNotExist:
                        return Response({"error":"Groupe invalid"},status=status.HTTP_400_BAD_REQUEST)
                
                
                if 'photo_profile' in files:
                    et.photo_profile=files['photo_profile']
                et.save()
            elif user.role==Utilisateur.Role.PROF:
                prof=user.prof_profile
                for f in ['specialite','matricule']:
                    if f in data:
                        setattr(prof,f,data[f])
                if 'departement_id' in data:
                    try:
                        dep=Departement.objects.get(id=data['departement_id'])
                        prof.departement=dep
                    except Departement.DoesNotExist:
                        return Response({"error": "Departement invalid"},status=status.HTTP_400_BAD_REQUEST)
                prof.save()
        return Response(
            {"message": "Utilisateur modifier avec succes"},status=status.HTTP_200_OK
        )
    except Utilisateur.DoesNotExist:
        return Response({"error":"Utilisateur introuvable"},status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error":str(e)},status=status.HTTP_500_INTERNAL_SERVER_ERROR)
@api_view(['POST'])
@permission_classes([IsAdminRole])
def admin_change_password(request, id):
    try:
        data = getattr(request, 'data', None) or {}
        if not data:
            data = getattr(request, 'POST', {})
        new_password = data.get('password') or (data.get('new_password') if isinstance(data, dict) else None)
        user = Utilisateur.objects.get(id=id)
        if not new_password or not str(new_password).strip():
            return Response(
                {"password": ["Mot de passe requis."]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        new_password = str(new_password).strip()
        try:
            validate_password(new_password, user)
        except DjangoValidationError as e:
            return Response(
                {"password": e.messages if hasattr(e, 'messages') else [str(e)]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.set_password(new_password)
        user.save(update_fields=['password'])
        Token.objects.filter(user=user).delete()
        return Response(
            {"message": "Mot de passe modifié avec succès."},
            status=status.HTTP_200_OK,
        )
    except Utilisateur.DoesNotExist:
        return Response(
            {"error": "Utilisateur introuvable."},
            status=status.HTTP_404_NOT_FOUND,
        )
    except Exception as e:
        return Response(
            {"error": str(e), "password": [str(e)]},
            status=status.HTTP_400_BAD_REQUEST,
        )
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def user_change_password(request):
    user=request.user
    data=request.data
    oldPassword=data.get('old_password')
    newPassword=data.get('new_password')
    if not oldPassword or not newPassword:
        return Response(
            {"error":"Old Password et New Password sont requis"},
            status=status.HTTP_400_BAD_REQUEST
        )
    if not user.check_password(oldPassword):
        return Response(
            {"old_password":"mot de passe actuel est incorrect"},
            status=status.HTTP_400_BAD_REQUEST
        )
    try:
        validate_password(newPassword,user)
    except DjangoValidationError as e:
        return Response(
            {"new_password":e.messages},
            status=status.HTTP_400_BAD_REQUEST
        )
    user.set_password(newPassword)
    user.save()
    return Response(
        {"message":"Mot de passe modifie avec succes"},
        status=status.HTTP_200_OK
    )

@api_view(['DELETE'])
@permission_classes([IsAdminRole])
def delete_user(request, id):
    try:
        try:
            user = Utilisateur.objects.get(id=id)
        except Utilisateur.DoesNotExist:
            return Response({"error": "Utilisateur introuvable"}, status=status.HTTP_404_NOT_FOUND)
        
        user.delete()
        return Response({"message": "Utilisateur supprimé avec succès"}, status=status.HTTP_204_NO_CONTENT)
    except Exception as e:
        return Response({"INTERNAL SERVER ERROR": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def request_password_reset(request):
    email = request.data.get('email')
    if not email:
        return Response({"error": "L'adresse email est requise."}, status=status.HTTP_400_BAD_REQUEST)

    user = Utilisateur.objects.filter(email__iexact=email).first()
    if user:
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        
        # Link points to the frontend
        reset_link = f"http://localhost:5173/reset-password/{uid}/{token}"
        
        subject = "Réinitialisation de votre mot de passe"
        message = f"Bonjour,\n\nVous avez demandé la réinitialisation de votre mot de passe. Veuillez cliquer sur le lien suivant pour choisir un nouveau mot de passe. Ce lien est valable pendant 10 minutes.\n\n{reset_link}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez cet email."
        
        try:
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email])
        except Exception as e:
            return Response({"error": f"Erreur lors de l'envoi de l'email: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response({"message": "Si un compte est associé à cette adresse, un email de réinitialisation vous a été envoyé."}, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password_confirm(request, uidb64, token):
    print(f"[DEBUG] reset_password_confirm - uidb64: {uidb64}, token: {token}")
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        print(f"[DEBUG] Decoded uid: {uid}")
        user = Utilisateur.objects.get(pk=uid)
        print(f"[DEBUG] Found user: {user.email}")
    except (TypeError, ValueError, OverflowError, Utilisateur.DoesNotExist) as e:
        print(f"[DEBUG] Error during user retrieval: {e}")
        user = None

    if user and default_token_generator.check_token(user, token):
        print("[DEBUG] Token check PASSED")
        new_password = request.data.get('new_password')
        if not new_password:
            return Response({"error": "Le nouveau mot de passe est requis."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            validate_password(new_password, user)
        except DjangoValidationError as e:
            return Response({"errors": e.messages}, status=status.HTTP_400_BAD_REQUEST)
            
        user.set_password(new_password)
        user.save()
        # Delete existing tokens
        Token.objects.filter(user=user).delete()
        
        return Response({"message": "Votre mot de passe a été réinitialisé avec succès."}, status=status.HTTP_200_OK)
    else:
        print("[DEBUG] Token check FAILED")
        if user:
            # Check if it was because of PASSWORD_RESET_TIMEOUT
            print(f"[DEBUG] Token check failed for user {user.email}. Token valid? {default_token_generator.check_token(user, token)}")
        return Response({"error": "Le lien de réinitialisation est invalide ou a expiré."}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_tour(request):
    user = request.user
    user.is_first_login = False
    user.save(update_fields=['is_first_login'])
    return Response({"message": "Tour completed"}, status=status.HTTP_200_OK)



@api_view(['GET'])
@permission_classes([IsAdminRole])
def dashbord_admin_stats(request):
    total_etudiants=Etudiant.objects.count()
    total_professeurs=Professeur.objects.count()
    total_filieres=Departement.objects.count()

    # Seance stores jour (weekday) + time only, not date; filter by today's weekday
    weekday_to_jour = {
        0: Seance.Jour.LUNDI,
        1: Seance.Jour.MARDI,
        2: Seance.Jour.MERCREDI,
        3: Seance.Jour.JEUDI,
        4: Seance.Jour.VENDREDI,
        5: Seance.Jour.SAMEDI,
        6: Seance.Jour.DIMANCHE,
    }
    today_weekday = timezone.now().weekday()
    jour_today = weekday_to_jour.get(today_weekday)

    # DEBUG: temporary prints — check terminal output
    print(f"[DEBUG] timezone.now() = {timezone.now()}")
    print(f"[DEBUG] today_weekday (int) = {today_weekday}")
    print(f"[DEBUG] jour_today (mapped string) = {jour_today}")

    seances_today = Seance.objects.filter(jour=jour_today).count() if jour_today else 0

    # DEBUG: session count
    print(f"[DEBUG] seances_today count = {seances_today}")


    etudiant_par_departement = Etudiant.objects.values('filiere__departement__nom')\
    .annotate(count=Count('id')) \
    .order_by('-count')

    # School-wide absence statistics (Using PresenceProf as official source)
    total_pointages = PresenceProf.objects.count()
    present_count = PresenceProf.objects.filter(status='PRESENT').count()
    absent_count = PresenceProf.objects.filter(status='ABSENT').count()
    retard_count = PresenceProf.objects.filter(status='RETARD').count()
    
    # Justified absences are those where justification is approved. 
    # Note: approved justifications change status to PRESENT in attendance/views.py
    justified_count = PresenceProf.objects.filter(justification__etat='APPROUVE').count()
    unjustified_count = absent_count 
    
    absence_stats = {
        "total_pointages": total_pointages,
        "present": present_count,
        "absent": absent_count,
        "retard": retard_count,
        "justified": justified_count,
        "unjustified": unjustified_count,
        "taux_absence_pct": round((absent_count / total_pointages) * 100, 2) if total_pointages else 0,
        "taux_presence_pct": round((present_count / total_pointages) * 100, 2) if total_pointages else 0,
    }

    # Absence per group (percentage) using PresenceProf
    groupe_pointage = PresenceProf.objects.values(
        'seance__groupe__id', 'seance__groupe__nom'
    ).annotate(
        total=Count('id'),
        absent_count=Count('id', filter=Q(status='ABSENT'))
    ).order_by('seance__groupe__nom')
    
    absence_par_groupe = [
        {
            "groupe_id": g["seance__groupe__id"],
            "groupe_nom": g["seance__groupe__nom"] or "-",
            "total": g["total"],
            "absent_count": g["absent_count"],
            "absent_pct": round((g["absent_count"] / g["total"]) * 100, 2) if g["total"] else 0,
        }
        for g in groupe_pointage if g["seance__groupe__id"] is not None
    ]

    recent_users = Utilisateur.objects.all().order_by('-date_joined')[:5]
    recent_users_data = [
        { 
            "id" : u.id,
            "name" : f"{u.last_name} {u.first_name}",
            "email" : u.email,
            "role" : u.role,
            "date_joined" : u.date_joined.strftime("%Y-%m-%d"),
        }
        for u in recent_users
    ]

    return Response({
        "stats": {
            "students": total_etudiants,
            "profs": total_professeurs,
            "seances_today": seances_today,
            "departements": total_filieres
        },
        "charts": {
            "pie_data": etudiant_par_departement
        },
        "recent_users": recent_users_data,
        "absence_stats": absence_stats,
        "absence_par_groupe": absence_par_groupe,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_profile_view(request):
    """Return full profile for the authenticated student."""
    user = request.user
    if user.role != Utilisateur.Role.ETUDIANT:
        return Response({"error": "Accès réservé aux étudiants."}, status=status.HTTP_403_FORBIDDEN)

    try:
        ep = user.etudiant_profile
    except Etudiant.DoesNotExist:
        return Response({"error": "Profil étudiant introuvable."}, status=status.HTTP_404_NOT_FOUND)

    data = {
        "full_name": f"{user.last_name or ''} {user.first_name or ''}".strip() or user.email,
        "first_name": user.first_name or "",
        "last_name": user.last_name or "",
        "email": user.email,
        "cne": ep.cne,
        "date_naissance": str(ep.date_naissance) if ep.date_naissance else None,
        "adresse": ep.adresse or "",
        "photo_profile": ep.photo_profile.url if ep.photo_profile else None,
    }

    if ep.filiere:
        data["filiere"] = {
            "nom": ep.filiere.nom,
            "type_diplome": ep.filiere.get_type_diplome_display() if hasattr(ep.filiere, 'get_type_diplome_display') else ep.filiere.type_diplome,
        }
    else:
        data["filiere"] = None

    if ep.groupe:
        data["groupe"] = {
            "nom": ep.groupe.nom,
            "niveau": ep.groupe.get_niveau_display() if hasattr(ep.groupe, 'get_niveau_display') else ep.groupe.niveau,
            "type_formation": ep.groupe.get_type_formation_display() if hasattr(ep.groupe, 'get_type_formation_display') else ep.groupe.type_formation,
        }
    else:
        data["groupe"] = None

    if ep.filiere and ep.filiere.departement:
        data["departement"] = {"nom": ep.filiere.departement.nom}
    else:
        data["departement"] = None

    return Response(data, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAdminRole | IsProfesseur])
def get_department_professors(request, id):
    try:
        user = request.user
        try:
            dep = Departement.objects.get(id=id)
        except Departement.DoesNotExist:
            return Response({"error": "Département introuvable"}, status=status.HTTP_404_NOT_FOUND)
            
        if user.role != 'ADMIN' and not (user.role == 'PROF' and hasattr(user, 'prof_profile') and user.prof_profile.chef_de_departement == dep):
            return Response({"error": "Accès non autorisé"}, status=status.HTTP_403_FORBIDDEN)
            
        profs = Professeur.objects.filter(departement=dep).select_related('user', 'chef_de_filiere')
        
        prof_data = []
        for prof in profs:
            prof_data.append({
                "id": prof.id,
                "nom": prof.user.last_name,
                "prenom": prof.user.first_name,
                "email": prof.user.email,
                "specialite": prof.specialite,
                "is_chef_filiere": hasattr(prof, 'chef_de_filiere') and prof.chef_de_filiere is not None,
                "chef_filiere_nom": prof.chef_de_filiere.nom if hasattr(prof, 'chef_de_filiere') and prof.chef_de_filiere else None,
                "chef_filiere_id": prof.chef_de_filiere.id if hasattr(prof, 'chef_de_filiere') and prof.chef_de_filiere else None
            })
            
        return Response(prof_data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"INTERNAL SERVER ERROR": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)