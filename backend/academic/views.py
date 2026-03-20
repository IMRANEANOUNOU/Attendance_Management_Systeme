from ast import Pass
from django.db.models import Q
from rest_framework.decorators import api_view,permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Departement, Groupe, Filiere, Module,Salle
from schedule.models import Seance
from .serializers import (DepartementSerializer,DepartementDetailSerializer,SalleSerializer,FiliereListSerializer,FiliereDetailSerializer,ModuleSerializer,GroupeSerializer)
from .permissions import IsAdminRole, IsChefDepartement, IsChefFiliere, IsEtudiant, IsProfesseur
from accounts.models import Professeur,Utilisateur,Etudiant
from django.db.models import Count, Q
from attendance.models import Pointage, PresenceProf, Justification
from django.utils import timezone
from accounts.serializers import EtudiantSerializer
@api_view(['GET'])
@permission_classes([IsAdminRole])
def get_departements(request):
    try:
        deps=Departement.objects.all()
        ser=DepartementSerializer(deps,many=True)
        return Response(ser.data,status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"INTERNAL SERVER ERROR":str(e)},status=status.HTTP_500_INTERNAL_SERVER_ERROR)
@api_view(['POST'])
@permission_classes([IsAdminRole])
def create_departement(request):
    try:
        if not request.data.get('nom'):
            return Response({"error": "Le nom du département est obligatoire"},status=status.HTTP_400_BAD_REQUEST)
        ser=DepartementDetailSerializer(data=request.data)
        if ser.is_valid():
            ser.save()
            return Response(ser.data,status=status.HTTP_201_CREATED)
        else:
            return Response(ser.errors,status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"INTERNAL SERVER ERROR":str(e)},status=status.HTTP_500_INTERNAL_SERVER_ERROR)
@api_view(['GET'])
@permission_classes([IsAdminRole | IsChefDepartement])
def get_departement_detail(request,id):
    user=request.user
    try:
        try:
            dep=Departement.objects.get(id=id)
        except Departement.DoesNotExist:
            return Response({"error":"Departement introuvable"},status=status.HTTP_404_NOT_FOUND)
        if user.role=='ADMIN':
            ser=DepartementDetailSerializer(dep)
            return Response(ser.data,status=status.HTTP_200_OK)
        elif (user.role=='PROF' and hasattr(user,'prof_profile') and user.prof_profile.chef_de_departement==dep):
            ser=DepartementDetailSerializer(dep)
            return Response(ser.data,status=status.HTTP_200_OK)
        else:
            return Response({"error":"Non autorise"},status=status.HTTP_403_FORBIDDEN)
    except Exception as e:
        return Response(
            {"INTERNAL SERVER ERROR": str(e)},status=status.HTTP_500_INTERNAL_SERVER_ERROR)
@api_view(['PUT']) 
@permission_classes([IsAdminRole | IsChefDepartement])
def update_departement(request,id):
    try:
        try:
            dep=Departement.objects.get(id=id)
        except Departement.DoesNotExist:
            return Response({"error":"Departement introuvable"},status=status.HTTP_404_NOT_FOUND)
        user=request.user
        if not (user.role == 'ADMIN' or (user.role=='PROF' and hasattr(user,'prof_profile') and user.prof_profile.chef_de_departement==dep)):
            return Response({"error":"Acces non autorise"},status=status.HTTP_403_FORBIDDEN)
        data=request.data.copy()
        data.pop('chef',None)
        ser=DepartementDetailSerializer(dep,data=data,partial=True)
        if ser.is_valid():
            ser.save()
            return Response(ser.data,status=status.HTTP_200_OK)
        return Response(ser.errors,status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"INTERNAL SERVER ERROOR":str(e)},status=status.HTTP_500_INTERNAL_SERVER_ERROR)
@api_view(['DELETE'])
@permission_classes([IsAdminRole])
def delete_departement(request, id):
    try:
        try:
            dep = Departement.objects.get(id=id)
        except Departement.DoesNotExist:
            return Response({"error": "Departement introuvable"},status=status.HTTP_404_NOT_FOUND)
        dep.delete()
        return Response({"message": "Département supprimé avec succès"},status=status.HTTP_204_NO_CONTENT)

    except Exception as e:
        return Response({"INTERNAL SERVER ERROR": str(e)},status=status.HTTP_500_INTERNAL_SERVER_ERROR)
@api_view(['GET'])
@permission_classes([IsAdminRole | IsChefDepartement])
def get_departement_filiers(request,id):
    try:
        try:
            dep=Departement.objects.get(id=id)
        except Departement.DoesNotExist:
            return Response({"error":"Departement introuvable"},status=status.HTTP_404_NOT_FOUND)
        user=request.user
        if user.role=='ADMIN':
            filieres=dep.filieres.all()
            ser=FiliereListSerializer(filieres,many=True)
            return Response(ser.data,status=status.HTTP_200_OK)
        if(user.role=='PROF' and hasattr(user,'prof_profile') and user.prof_profile.chef_de_departement==dep):
            filieres=dep.filieres.all()
            ser=FiliereListSerializer(filieres,many=True)
            return Response(ser.data,status=status.HTTP_200_OK)
        return Response({"error":"Acces non autorise"},status=status.HTTP_403_FORBIDDEN)
    except Exception as e:
        return Response({"INTERNAL SERVER ERROR":str(e)},status=status.HTTP_500_INTERNAL_SERVER_ERROR)
@api_view(['PUT'])
@permission_classes([IsAdminRole])
def change_chef_departement(request, id):
    try:
        try:
            dep = Departement.objects.get(id=id)
        except Departement.DoesNotExist:
            return Response({"error": "Departement introuvable"},status=status.HTTP_404_NOT_FOUND)
        chef_id = request.data.get('chef')
        if not chef_id:
            return Response({"error": "Le champ 'chef' est obligatoire"},status=status.HTTP_400_BAD_REQUEST)
        try:
            new_chef = Professeur.objects.get(id=chef_id)
        except Professeur.DoesNotExist:
            return Response({"error": "Professeur introuvable"},status=status.HTTP_404_NOT_FOUND)
        if hasattr(new_chef, 'chef_de_departement') and new_chef.chef_de_departement and new_chef.chef_de_departement!=dep:
            return Response({"error": "Ce professeur est déjà chef d'un département"},status=status.HTTP_400_BAD_REQUEST)
        dep.chef = new_chef
        dep.save()
        return Response({"message": "Chef de département modifié avec succès","departement": dep.nom,"chef": f"{new_chef.user.last_name} {new_chef.user.first_name}"},status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"INTERNAL SERVER ERROR": str(e)},status=status.HTTP_500_INTERNAL_SERVER_ERROR)
@api_view(['GET'])
@permission_classes([IsAdminRole | IsChefDepartement])
def department_stats(request, id):
    try:
        try:
            dep=Departement.objects.get(id=id)
        except Departement.DoesNotExist:
            return Response({"error": "Departement introuvable"},status=status.HTTP_404_NOT_FOUND)
        user=request.user
        if user.role=='ADMIN':
            pass
        elif (user.role=='PROF' and hasattr(user,'prof_profile') and user.prof_profile.chef_de_departement==dep):
            pass
        else:
            return Response({"error": "Accès non autorisé"},status=status.HTTP_403_FORBIDDEN)
        filieres=dep.filieres.all()
        groupes=Groupe.objects.filter(filiere__in=filieres)
        etudiants_users=Utilisateur.objects.filter(etudiant_profile__groupe__in=groupes)
        # Use PresenceProf as the official source for statistics
        pointages = PresenceProf.objects.filter(etudiant__in=etudiants_users)
        total_pointages = pointages.count()
        present = pointages.filter(status='PRESENT').count()
        absent = pointages.filter(status='ABSENT').count()
        retard = pointages.filter(status='RETARD').count()
        
        # Justified are those with approved justifications (status becomes PRESENT)
        justifies = pointages.filter(justification__etat='APPROUVE').count()
        non_justifies = absent
        
        stats = {
            "departement": dep.nom,
            "structure": {
                "filieres": filieres.count(),
                "groupes": groupes.count(),
                "etudiants": etudiants_users.count()
            },

            "pointages": {
                "total": total_pointages,
                "present": present,
                "absent": absent,
                "retard": retard
            },

            "taux": {
                "presence": round((present/total_pointages)*100,2) if total_pointages>0 else 0,
                "absence": round((absent/total_pointages)*100,2) if total_pointages>0 else 0,
                "retard": round((retard/total_pointages)*100,2) if total_pointages>0 else 0
            },
            "absences": {
                "justifiees": justifies,
                "non_justifiees": non_justifies
            }
        }
        return Response(stats, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"INTERNAL SERVER ERROR": str(e)},status=status.HTTP_500_INTERNAL_SERVER_ERROR)
@api_view(['GET'])
@permission_classes([IsAdminRole])
def get_all_filieres(request):
    try:
        filieres = Filiere.objects.select_related('departement').all().order_by('departement__nom', 'nom')
        ser = FiliereListSerializer(filieres, many=True)
        return Response(ser.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"INTERNAL SERVER ERROR": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
@api_view(['POST'])
@permission_classes([IsAdminRole | IsChefDepartement])
def create_filiere_in_departement(request,id):
    try:
        try:
            dep=Departement.objects.get(id=id)
        except Departement.DoesNotExist:
            return Response({"error":"Departement introuvable"},status=status.HTTP_404_NOT_FOUND)
        user=request.user
        data=request.data.copy()
        if user.role != 'ADMIN' and not (user.role=='PROF' and hasattr(user,'prof_profile') and user.prof_profile.chef_de_departement==dep):
            return Response({"error":"Acces non autorise"},status=status.HTTP_403_FORBIDDEN)
        if not data.get('nom'):
            return Response({"error":"Le nom de la filiere est obligatoire"},status=status.HTTP_400_BAD_REQUEST)
        data.setdefault('type_diplome', Filiere.TypeDiplome.DUT)
        if Filiere.objects.filter(nom=data['nom'],departement=dep).exists():
            return Response({"error":"Cette filiere existe deja dans ce departement"},status=status.HTTP_400_BAD_REQUEST)
        ser=FiliereListSerializer(data=data)
        if ser.is_valid():
            ser.save(departement=dep)
            return Response(ser.data,status=status.HTTP_201_CREATED)
        return Response(ser.errors,status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"INTERNAL SERVER ERROR":str(e)},status=status.HTTP_500_INTERNAL_SERVER_ERROR)
@api_view(['GET'])
@permission_classes([IsAdminRole | IsChefFiliere])
def get_filiere_detail(request, id):
    try:
        try:
            filiere = Filiere.objects.select_related('departement').get(id=id)
        except Filiere.DoesNotExist:
            return Response({"error": "Filière introuvable"},status=status.HTTP_404_NOT_FOUND)
        user=request.user
        if user.role == 'ADMIN':
            pass
        elif (user.role=='PROF'and hasattr(user,'prof_profile') and (filiere.chef == user.prof_profile or filiere.departement.chef == user.prof_profile)):
            pass
        else:
            return Response({"error": "Accès non autorisé"}, status=status.HTTP_403_FORBIDDEN)
        ser = FiliereDetailSerializer(filiere)
        return Response(ser.data,status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"INTERNAL SERVER ERROR": str(e)},status=status.HTTP_500_INTERNAL_SERVER_ERROR)
@api_view(['PUT'])
@permission_classes([IsAdminRole | IsChefDepartement])
def assign_chef_filiere(request, id):
    try:
        try:
            filiere = Filiere.objects.select_related('departement').get(id=id)
        except Filiere.DoesNotExist:
            return Response({"error": "Filière introuvable"}, status=status.HTTP_404_NOT_FOUND)
        
        user = request.user
        if user.role != 'ADMIN' and not (user.role == 'PROF' and hasattr(user, 'prof_profile') and user.prof_profile.chef_de_departement == filiere.departement):
            return Response({"error": "Accès non autorisé"}, status=status.HTTP_403_FORBIDDEN)
        
        prof_id = request.data.get('prof_id')
        
        if not prof_id:
            # Unassign the chef
            filiere.chef = None
            filiere.save()
            return Response({
                "message": "Chef de filière retiré avec succès",
                "filiere": filiere.nom,
                "chef": None
            }, status=status.HTTP_200_OK)
            
        try:
            professeur = Professeur.objects.get(id=prof_id)
        except Professeur.DoesNotExist:
            return Response({"error": "Professeur introuvable"}, status=status.HTTP_404_NOT_FOUND)
            
        if hasattr(professeur, 'chef_de_filiere') and professeur.chef_de_filiere and professeur.chef_de_filiere != filiere:
            return Response({"error": "Ce professeur est déjà chef d'une autre filière"}, status=status.HTTP_400_BAD_REQUEST)
            
        filiere.chef = professeur
        filiere.save()
        
        return Response({
            "message": "Chef de filière assigné avec succès",
            "filiere": filiere.nom,
            "chef": f"{professeur.user.last_name} {professeur.user.first_name}"
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({"INTERNAL SERVER ERROR": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
@permission_classes([IsAdminRole | IsChefFiliere | IsChefDepartement])
def update_filiere(request, id):
    try:
        try:
            filiere = Filiere.objects.select_related('departement').get(id=id)
        except Filiere.DoesNotExist:
            return Response({"error": "Filière introuvable"},status=status.HTTP_404_NOT_FOUND)
        user = request.user
        data = request.data.copy()
        if user.role == 'ADMIN':
            ser = FiliereDetailSerializer(filiere, data=data, partial=True)
            if ser.is_valid():
                ser.save()
                return Response(ser.data, status=status.HTTP_200_OK)
            return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)
        elif (user.role == 'PROF' and hasattr(user,'prof_profile') and filiere.chef == user.prof_profile):
            data.pop('chef',None)
            data.pop('departement',None)
            ser = FiliereDetailSerializer(filiere, data=data, partial=True
            )
            if ser.is_valid():
                ser.save()
                return Response(ser.data, status=status.HTTP_200_OK)
            return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)
        elif (user.role == 'PROF' and hasattr(user,'prof_profile') and filiere.departement.chef==user.prof_profile):
            if 'chef' not in data:
                return Response({"error": "Seul le champ 'chef' peut être modifié"},status=status.HTTP_400_BAD_REQUEST)
            ser = FiliereDetailSerializer(filiere,data={'chef': data.get('chef')},partial=True)
            if ser.is_valid():
                ser.save()
                return Response(ser.data, status=status.HTTP_200_OK)
            return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)
        else:    
            return Response({"error": "Accès non autorisé"},status=status.HTTP_403_FORBIDDEN)
    except Exception as e:
        return Response({"INTERNAL SERVER ERROR": str(e)},status=status.HTTP_500_INTERNAL_SERVER_ERROR)
@api_view(['DELETE'])
@permission_classes([IsAdminRole | IsChefDepartement])
def delete_filiere(request, id):
    try:
        try:
            filiere = Filiere.objects.select_related('departement').get(id=id)
        except Filiere.DoesNotExist:
            return Response({"error": "Filière introuvable"},status=status.HTTP_404_NOT_FOUND)
        user=request.user
        if user.role != 'ADMIN' and not (user.role=='PROF' and hasattr(user,'prof_profile') and filiere.departement.chef==user.prof_profile):
            return Response({"error": "Accès non autorisé"},status=status.HTTP_403_FORBIDDEN)
        if filiere.groupes.exists():
            return Response(
                {"error": "Impossible de supprimer une filière contenant des groupes"},status=status.HTTP_400_BAD_REQUEST)
        filiere.delete()
        return Response({"message":"Filière supprimée avec succès"},status=status.HTTP_204_NO_CONTENT)
    except Exception as e:
        return Response({"INTERNAL SERVER ERROR": str(e)},status=status.HTTP_500_INTERNAL_SERVER_ERROR)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_filiere_students(request, id):
    try:
        try:
            filiere = Filiere.objects.select_related('departement').get(id=id)
        except Filiere.DoesNotExist:
            return Response({"error": "Filière introuvable"},status=status.HTTP_404_NOT_FOUND)
        user = request.user
        if user.role=='ADMIN':
            pass
        elif (user.role=='PROF' and hasattr(user,'prof_profile') and (filiere.chef==user.prof_profile or filiere.departement.chef==user.prof_profile)):
            pass
        else:
            return Response({"error": "Accès non autorisé"},status=status.HTTP_403_FORBIDDEN)
        groupes = filiere.groupes.all()
        etudiants = Utilisateur.objects.filter(etudiant_profile__groupe__in=groupes).select_related('etudiant_profile__groupe').distinct()
        data = [
            {
                "id": etu.id,
                "nom": etu.last_name,
                "prenom": etu.first_name,
                "email": etu.email,
                "groupe": etu.etudiant_profile.groupe.nom if hasattr(etu,'etudiant_profile') and etu.etudiant_profile.groupe else "Non assigne"
            }
            for etu in etudiants
        ]
        return Response(
            {
                "filiere": filiere.nom,
                "total": etudiants.count(),
                "students": data
            },status=status.HTTP_200_OK
        )
    except Exception as e:
        return Response({"INTERNAL SERVER ERROR": str(e)},status=status.HTTP_500_INTERNAL_SERVER_ERROR)
@api_view(['GET'])
@permission_classes([IsAdminRole | IsChefDepartement | IsChefFiliere])
def filieres_stats(request, id):
    try:
        try:
            fil=Filiere.objects.get(id=id)
        except Filiere.DoesNotExist:
            return Response({"error": "Filiere introuvable"},status=status.HTTP_404_NOT_FOUND)
        user=request.user
        if user.role=='ADMIN':
            pass
        elif (user.role=='PROF' and hasattr(user,'prof_profile')):
            if user.prof_profile.chef_de_departement==fil.departement:
                pass
            elif user.prof_profile.chef_de_filiere==fil:
                pass
            else:
                return Response({"error": "Accès non autorisé"},status=status.HTTP_403_FORBIDDEN)
        else: return Response({"error":"Acces non autorise"},status=status.HTTP_403_FORBIDDEN)
        groupes=fil.groupes.all()
        etudiants_users=Utilisateur.objects.filter(etudiant_profile__groupe__in=groupes)
        # Use PresenceProf as the official source for statistics
        pointages = PresenceProf.objects.filter(etudiant__in=etudiants_users)
        total_pointages = pointages.count()
        present = pointages.filter(status='PRESENT').count()
        absent = pointages.filter(status='ABSENT').count()
        retard = pointages.filter(status='RETARD').count()
        
        # Justified are those with approved justifications (status becomes PRESENT)
        justifies = pointages.filter(justification__etat='APPROUVE').count()
        non_justifies = absent
        
        stats = {
            "Departement":fil.departement.nom,
            "Filiere": fil.nom,
            "structure": {
                "groupes": groupes.count(),
                "etudiants": etudiants_users.count()
            },

            "pointages": {
                "total": total_pointages,
                "present": present,
                "absent": absent,
                "retard": retard
            },

            "taux": {
                "presence": round((present/total_pointages)*100,2) if total_pointages>0 else 0,
                "absence": round((absent/total_pointages)*100,2) if total_pointages>0 else 0,
                "retard": round((retard/total_pointages)*100,2) if total_pointages>0 else 0
            },
            "absences": {
                "justifiees": justifies,
                "non_justifiees": non_justifies
            }
        }
        return Response(stats, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"INTERNAL SERVER ERROR": str(e)},status=status.HTTP_500_INTERNAL_SERVER_ERROR)
@api_view(['GET'])
@permission_classes([IsAdminRole | IsChefDepartement | IsChefFiliere | IsProfesseur])
def get_modules(request):
    try:
        user=request.user
        if user.role=='ADMIN':
            modules=Module.objects.select_related('filiere', 'professeur__user')
        elif user.role=='PROF' and hasattr(user, 'prof_profile'):
            prof=user.prof_profile
            # Check for Chef de Departement
            if hasattr(prof, 'chef_de_departement') and prof.chef_de_departement:
                modules = Module.objects.filter(filiere__departement=prof.chef_de_departement).select_related('filiere', 'professeur__user')
            # Check for Chef de Filiere
            elif hasattr(prof, 'chef_de_filiere') and prof.chef_de_filiere:
                modules = Module.objects.filter(filiere=prof.chef_de_filiere).select_related('filiere', 'professeur__user')
            # Regular Professor
            else:
                modules = Module.objects.filter(professeur=prof).select_related('filiere', 'professeur__user')
        else:
            return Response({"error": "Accès non autorisé"},status=status.HTTP_403_FORBIDDEN)
        ser = ModuleSerializer(modules, many=True)
        return Response(
            {
                "total": modules.count(),
                "modules": ser.data
            },status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"INTERNAL SERVER ERROR": str(e)},status=status.HTTP_500_INTERNAL_SERVER_ERROR)
@api_view(['POST'])
@permission_classes([IsChefFiliere | IsAdminRole])
def create_module(request):
    try:
        user = request.user
        data = request.data
        if not data.get('nom') or not data.get('filiere'):
            return Response({"error": "Les champs 'nom' et 'filiere' sont obligatoires"},status=status.HTTP_400_BAD_REQUEST)
        try:
            filiere = Filiere.objects.get(id=data.get('filiere'))
        except Filiere.DoesNotExist:
            return Response({"error": "Filière introuvable"},status=status.HTTP_404_NOT_FOUND)
        if (user.role == 'PROF' and hasattr(user, 'prof_profile') and user.prof_profile.chef_de_filiere == filiere):
            pass
        elif user.role=='ADMIN':
            pass
        else:
            return Response({"error": "Accès non autorisé"},status=status.HTTP_403_FORBIDDEN)
        if Module.objects.filter(nom=data['nom'],filiere=filiere).exists():
            return Response({"error": "Ce module existe déjà dans cette filière"},status=status.HTTP_400_BAD_REQUEST)
        serializer = ModuleSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data,status=status.HTTP_201_CREATED)
        return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"INTERNAL SERVER ERROR": str(e)},status=status.HTTP_500_INTERNAL_SERVER_ERROR)
@api_view(['GET'])
@permission_classes([IsAdminRole | IsChefDepartement | IsChefFiliere | IsProfesseur])
def get_module_detail(request, id):
    try:
        try:
            module=Module.objects.select_related('filiere__departement','professeur__user').get(id=id)
        except Module.DoesNotExist:
            return Response({"error": "Module introuvable"},status=status.HTTP_404_NOT_FOUND)
        user = request.user
        if user.role=='ADMIN':
            pass
        elif user.role == 'PROF' and hasattr(user, 'prof_profile'):
            prof=user.prof_profile
            if (prof==module.professeur or prof==module.filiere.chef or prof == module.filiere.departement.chef):
                pass
            else:
                return Response({"error": "Accès non autorisé"},status=status.HTTP_403_FORBIDDEN)
        else:
            return Response({"error": "Accès non autorisé"},status=status.HTTP_403_FORBIDDEN)
        serializer = ModuleSerializer(module)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"INTERNAL SERVER ERROR": str(e)},status=status.HTTP_500_INTERNAL_SERVER_ERROR)
@api_view(['PUT'])
@permission_classes([IsChefFiliere | IsAdminRole])
def update_module(request, id):
    try:
        try:
            module = Module.objects.select_related('filiere').get(id=id)
        except Module.DoesNotExist:
            return Response({"error": "Module introuvable"},status=status.HTTP_404_NOT_FOUND)
        user = request.user
        if (user.role=='PROF' and hasattr(user, 'prof_profile') and user.prof_profile.chef_de_filiere==module.filiere):
            pass
        elif user.role=='ADMIN':
            pass
        else:
            return Response({"error": "Accès non autorisé"},status=status.HTTP_403_FORBIDDEN)
        data=request.data.copy()
        data.pop('filiere',None)
        data.pop('professeur',None)
        ser = ModuleSerializer(module,data=data,partial=True)
        if ser.is_valid():
            ser.save()
            return Response(ser.data,status=status.HTTP_200_OK)
        return Response(ser.errors,status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"INTERNAL SERVER ERROR": str(e)},status=status.HTTP_500_INTERNAL_SERVER_ERROR)
@api_view(['DELETE'])
@permission_classes([IsChefFiliere | IsAdminRole])
def delete_module(request, id):
    try:
        try:
            module=Module.objects.select_related('filiere').get(id=id)
        except Module.DoesNotExist:
            return Response({"error": "Module introuvable"},status=status.HTTP_404_NOT_FOUND)
        user=request.user
        if user.role != 'ADMIN' and not (user.role == 'PROF' and hasattr(user, 'prof_profile') and user.prof_profile.chef_de_filiere == module.filiere):
            return Response({"error": "Accès non autorisé"},status=status.HTTP_403_FORBIDDEN)
        module.delete()
        return Response({"message": "Module supprimé avec succès"},status=status.HTTP_204_NO_CONTENT)
    except Exception as e:
        return Response({"INTERNAL SERVER ERROR": str(e)},status=status.HTTP_500_INTERNAL_SERVER_ERROR)
@api_view(['POST'])
@permission_classes([IsChefFiliere])
def assign_professor_to_module(request, id):
    try:
        try:
            module = Module.objects.select_related('filiere').get(id=id)
        except Module.DoesNotExist:
            return Response({"error":"Module introuvable"},status=status.HTTP_404_NOT_FOUND)
        user=request.user
        data=request.data
        if not (user.role == 'PROF' and hasattr(user, 'prof_profile')
            and user.prof_profile.chef_de_filiere == module.filiere):
            return Response({"error":"Accès non autorisé"},status=status.HTTP_403_FORBIDDEN)
        professeur_id=data.get('professeur')
        if not professeur_id:
            return Response({"error":"professeur est requis"},status=status.HTTP_400_BAD_REQUEST)
        try:
            professeur=Professeur.objects.get(id=professeur_id)
        except Professeur.DoesNotExist:
            return Response({"error": "Professeur introuvable"},status=status.HTTP_404_NOT_FOUND)
        module.professeur=professeur
        module.save()
        return Response(
            {
                "message": "Professeur affecté au module avec succès",
                "module": module.nom,
                "professeur": professeur.user.get_full_name()
            },status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"INTERNAL SERVER ERROR": str(e)},status=status.HTTP_500_INTERNAL_SERVER_ERROR)
@api_view(['GET'])
@permission_classes([IsAdminRole | IsProfesseur])
def list_groups(request):
    try:
        user=request.user
        groupes=Groupe.objects.none()
        if user.role=='ADMIN':
            groupes=Groupe.objects.all()
        elif user.role=='PROF' and hasattr(user,'prof_profile'):
            prof=user.prof_profile
            if prof.chef_de_departement:
                groupes = Groupe.objects.filter(filiere__departement=prof.chef_de_departement)
            elif prof.chef_de_filiere:
                groupes=Groupe.objects.filter(filiere=prof.chef_de_filiere)
            else:
                groupes = Groupe.objects.filter(seances__module__professeur=prof).distinct()
        else:
            return Response({"error": "Accès non autorisé"},status=status.HTTP_403_FORBIDDEN)
        ser = GroupeSerializer(groupes.select_related('filiere'),many=True)
        return Response(ser.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"INTERNAL SERVER ERROR": str(e)},status=status.HTTP_500_INTERNAL_SERVER_ERROR)
@api_view(['POST'])
@permission_classes([IsChefFiliere | IsAdminRole])
def create_groups(request):
    try:
        user=request.user
        data=request.data
        if not data.get('nom') or not data.get('filiere'):
            return Response({"error": "Les champs 'nom' et 'filiere' sont obligatoires"},status=status.HTTP_400_BAD_REQUEST)
        try:
            filiere = Filiere.objects.get(id=data.get('filiere'))
        except Filiere.DoesNotExist:
            return Response({"error": "Filière introuvable"},status=status.HTTP_404_NOT_FOUND)
        if user.role=='ADMIN':
            pass
        elif user.role=='PROF' and hasattr(user,'prof_profile'):
            prof=user.prof_profile
            if prof.chef_de_filiere==filiere:
                pass
            else:
                return Response({"error": "Accès non autorisé"},status=status.HTTP_403_FORBIDDEN)
        else:
            return Response({"error":"Acces non autorises"},status=status.HTTP_403_FORBIDDEN)
        if Groupe.objects.filter(nom=data['nom'],filiere=filiere).exists():
            return Response({"error":"Groupe already in this filiere"},status=status.HTTP_400_BAD_REQUEST)
        ser=GroupeSerializer(data=data)
        if ser.is_valid():
            ser.save()
            return Response(ser.data,status=status.HTTP_201_CREATED)
        else:
            return Response(ser.errors,status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"INTERNAL SERVER ERROR":str(e)},status=status.HTTP_500_INTERNAL_SERVER_ERROR)
@api_view(['GET'])
@permission_classes([IsAdminRole | IsProfesseur])
def group_detail(request, id):
    try:
        user=request.user
        try:
            groupe = Groupe.objects.select_related('filiere__departement').get(id=id)
        except Groupe.DoesNotExist:
            return Response({"error": "Groupe introuvable"},status=status.HTTP_404_NOT_FOUND)
        if user.role=='ADMIN':
            pass
        elif user.role=='PROF' and hasattr(user, 'prof_profile'):
            prof=user.prof_profile
            # Check if prof is chef de departement or chef de filiere safely (OneToOneField reverse relations)
            is_chef_dep = hasattr(prof, 'chef_de_departement') and prof.chef_de_departement == groupe.filiere.departement
            is_chef_filiere = hasattr(prof, 'chef_de_filiere') and prof.chef_de_filiere == groupe.filiere
            
            if is_chef_dep:
                pass
            elif is_chef_filiere:
                pass
            elif Seance.objects.filter(groupe=groupe, professeur=prof).exists():
                pass
            elif Seance.objects.filter(groupe=groupe, module__professeur=prof).exists():
                pass
            else:
                return Response({"error":"Acces non autorise. Vous n'enseignez pas ce groupe."},status=status.HTTP_403_FORBIDDEN)
        else:
            return Response({"error": "Accès non autorisé"},status=status.HTTP_403_FORBIDDEN)
        etudiants = Etudiant.objects.filter(groupe=groupe).select_related('user')
        data={
            "groupe": GroupeSerializer(groupe).data,
            "etudiants": EtudiantSerializer(etudiants, many=True).data
        }
        return Response(data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"INTERNAL SERVER ERROR": str(e)},status=status.HTTP_500_INTERNAL_SERVER_ERROR)
@api_view(['PUT'])
@permission_classes([IsChefFiliere | IsAdminRole])
def update_group(request, id):
    try:
        try:
            groupe = Groupe.objects.select_related('filiere').get(id=id)
        except Groupe.DoesNotExist:
            return Response({"error": "Groupe introuvable"},status=status.HTTP_404_NOT_FOUND)
        user=request.user
        if user.role != 'ADMIN' and not (user.role=='PROF' and hasattr(user, 'prof_profile') and user.prof_profile.chef_de_filiere==groupe.filiere):
            return Response({"error": "Accès non autorisé"},status=status.HTTP_403_FORBIDDEN)
        data = request.data
        if 'nom' not in data or not data['nom']:
            return Response({"error": "Le champ 'nom' est obligatoire"},status=status.HTTP_400_BAD_REQUEST)
        if 'filiere' in data:
            return Response({"error": "Modification de la filière interdite"},status=status.HTTP_400_BAD_REQUEST)
        if Groupe.objects.filter(nom=data['nom'],filiere=groupe.filiere).exclude(id=groupe.id).exists():
            return Response({"error": "Un groupe avec ce nom existe déjà"},status=status.HTTP_409_CONFLICT)
        ser = GroupeSerializer(groupe,data={"nom": data['nom'], "filiere": groupe.filiere.id},partial=True)
        if ser.is_valid():
            ser.save()
            return Response(ser.data, status=status.HTTP_200_OK)
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"INTERNAL SERVER ERROR": str(e)},status=status.HTTP_500_INTERNAL_SERVER_ERROR)
@api_view(['DELETE'])
@permission_classes([IsChefFiliere | IsAdminRole])
def delete_group(request, id):
    try:
        try:
            groupe = Groupe.objects.select_related('filiere').get(id=id)
        except Groupe.DoesNotExist:
            return Response({"error": "Groupe introuvable"}, status=status.HTTP_404_NOT_FOUND)
        user = request.user
        if user.role == 'ADMIN':
            pass
        elif user.role == 'PROF' and hasattr(user, 'prof_profile'):
            prof = user.prof_profile
            if prof.chef_de_filiere == groupe.filiere:
                pass
            else:
                return Response({"error": "Accès non autorisé"}, status=status.HTTP_403_FORBIDDEN)
        else:
            return Response({"error": "Accès non autorisé"}, status=status.HTTP_403_FORBIDDEN)
        groupe.delete()
        return Response({"message": "Groupe supprimé avec succès"}, status=status.HTTP_204_NO_CONTENT)
    except Exception as e:
        return Response({"INTERNAL SERVER ERROR": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_salles(request):
    try:
        salles = Salle.objects.all().order_by('nom')
        ser = SalleSerializer(salles,many=True)
        return Response(ser.data,status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"INTERNAL SERVER ERROR": str(e)},status=status.HTTP_500_INTERNAL_SERVER_ERROR)
@api_view(['POST'])
@permission_classes([IsAdminRole])
def create_salle(request):
    try:
        user=request.user
        data=request.data
        required_fields=['nom','capacite','latitude','longitude']
        for field in required_fields:
            if not data.get(field):
                return Response({"error": f"Le champ '{field}' est obligatoire"},status=status.HTTP_400_BAD_REQUEST)
        if Salle.objects.filter(nom=data['nom']).exists():
            return Response({"error": "Une salle avec ce nom existe déjà"},status=status.HTTP_409_CONFLICT)
        serializer = SalleSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"INTERNAL SERVER ERROR": str(e)},status=status.HTTP_500_INTERNAL_SERVER_ERROR)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_salle_detail(request, id):
    try:
        try:
            salle = Salle.objects.get(id=id)
        except Salle.DoesNotExist:
            return Response({"error": "Salle introuvable"},status=status.HTTP_404_NOT_FOUND)
        ser = SalleSerializer(salle)
        return Response(ser.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"INTERNAL SERVER ERROR": str(e)},status=status.HTTP_500_INTERNAL_SERVER_ERROR)
@api_view(['PUT'])
@permission_classes([IsAdminRole])
def update_salle(request, id):
    try:
        user=request.user
        try:
            salle=Salle.objects.get(id=id)
        except Salle.DoesNotExist:
            return Response({"error": "Salle introuvable"},status=status.HTTP_404_NOT_FOUND)
        ser=SalleSerializer(salle,data=request.data,partial=True)
        if ser.is_valid():
            ser.save()
            return Response(ser.data, status=status.HTTP_200_OK)
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"INTERNAL SERVER ERROR": str(e)},status=status.HTTP_500_INTERNAL_SERVER_ERROR)
@api_view(['DELETE'])
@permission_classes([IsAdminRole])
def delete_salle(request, id):
    try:
        try:
            salle=Salle.objects.get(id=id)
        except Salle.DoesNotExist:
            return Response({"error": "Salle introuvable"},status=status.HTTP_404_NOT_FOUND)
        if salle.seances.exists():
            return Response({"error": "Impossible de supprimer: la salle est liée à des séances"},status=status.HTTP_400_BAD_REQUEST)
        salle.delete()
        return Response({"message": "Salle supprimée avec succès"},status=status.HTTP_204_NO_CONTENT)
    except Exception as e:
        return Response({"INTERNAL SERVER ERROR": str(e)},status=status.HTTP_500_INTERNAL_SERVER_ERROR)
@api_view(['GET'])
@permission_classes([IsProfesseur | IsEtudiant])
def my_modules(request):
    try:
        user=request.user
        modules=Module.objects.none()
        if user.role=='PROF' and hasattr(user, 'prof_profile'):
            modules=Module.objects.filter(
                professeur=user.prof_profile
            )
        elif user.role=='ETUDIANT' and hasattr(user, 'etudiant_profile'):
            filiere=user.etudiant_profile.groupe.filiere
            modules=Module.objects.filter(filiere=filiere)
        else:
            return Response({"error": "Accès non autorisé"},status=status.HTTP_403_FORBIDDEN)
        ser=ModuleSerializer(
            modules.select_related('filiere', 'professeur'),
            many=True
        )
        return Response(ser.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"INTERNAL SERVER ERROR": str(e)},status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAdminRole | IsChefDepartement])
def departement_suivi_pedagogique(request, id):
    try:
        try:
            dep = Departement.objects.get(id=id)
        except Departement.DoesNotExist:
            return Response({"error": "Département introuvable"}, status=status.HTTP_404_NOT_FOUND)
            
        user = request.user
        if user.role != 'ADMIN' and not (user.role == 'PROF' and hasattr(user, 'prof_profile') and user.prof_profile.chef_de_departement == dep):
            return Response({"error": "Accès non autorisé"}, status=status.HTTP_403_FORBIDDEN)
            
        filieres = dep.filieres.all()
        modules = Module.objects.filter(filiere__in=filieres).select_related('filiere', 'professeur__user')
        
        # Calculate module progress
        module_data = []
        for mod in modules:
            # Assuming standard duration of 2 hours per seance
            # 2 hours = 120 minutes. Using generic 40 hours total.
            heures_totales = 40
            seances_cloturees = Seance.objects.filter(module=mod, statut_seance='CLOTUREE')
            
            # Simple assumption: each seance is roughly 2 hours for this calculation if exact duration is missing.
            heures_faites = 0
            for s in seances_cloturees:
                if s.heure_fin and s.heure_debut:
                    delta = (s.heure_fin.hour * 60 + s.heure_fin.minute) - (s.heure_debut.hour * 60 + s.heure_debut.minute)
                    if delta > 0:
                        heures_faites += delta / 60
                else:
                    heures_faites += 2 # Fallback
            
            # Bound the made hours
            heures_faites = min(heures_faites, heures_totales)
            
            module_data.append({
                "id": mod.id,
                "module_nom": mod.nom,
                "prof_nom": f"{mod.professeur.user.last_name} {mod.professeur.user.first_name}" if mod.professeur else "Non assigné",
                "filiere_nom": mod.filiere.nom,
                "filiere_id": mod.filiere.id,
                "heures_faites": round(heures_faites, 1),
                "heures_totales": heures_totales,
                "progression": round((heures_faites / heures_totales) * 100) if heures_totales > 0 else 0
            })
            
        # Calculate filiere progress
        filiere_data = []
        for fil in filieres:
            fil_modules = [m for m in module_data if m['filiere_id'] == fil.id]
            if fil_modules:
                avg_prog = sum(m['progression'] for m in fil_modules) / len(fil_modules)
            else:
                avg_prog = 0
                
            filiere_data.append({
                "id": fil.id,
                "nom": fil.nom,
                "progression": round(avg_prog),
                "modules_count": len(fil_modules)
            })
            
        return Response({
            "departement": dep.nom,
            "filieres": filiere_data,
            "modules": module_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({"INTERNAL SERVER ERROR": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAdminRole | IsChefDepartement])
def departement_stats(request, id):
    try:
        try:
            dep = Departement.objects.get(id=id)
        except Departement.DoesNotExist:
            return Response({"error": "Département introuvable"}, status=status.HTTP_404_NOT_FOUND)
            
        user = request.user
        if user.role != 'ADMIN' and not (user.role == 'PROF' and hasattr(user, 'prof_profile') and user.prof_profile.chef_de_departement == dep):
            return Response({"error": "Accès non autorisé"}, status=status.HTTP_403_FORBIDDEN)
            
        # Total Filieres & Students
        filieres = dep.filieres.all()
        total_filieres = filieres.count()
        
        groupes = Groupe.objects.filter(filiere__in=filieres)
        total_groupes = groupes.count()
        
        etudiants = Etudiant.objects.filter(filiere__in=filieres)
        total_etudiants = etudiants.count()
        
        # Pointages / Absences for this department
        user_ids = etudiants.values_list('user_id', flat=True)
        pointages = Pointage.objects.filter(etudiant_id__in=user_ids)
        
        total_pointages = pointages.count()
        present_count = pointages.filter(status='PRESENT').count()
        absent_count = pointages.filter(status='ABSENT').count()
        retard_count = pointages.filter(status='RETARD').count()
        
        justified_count = pointages.filter(status='ABSENT', justification__etat='APPROUVE').count()
        unjustified_count = absent_count - justified_count
        
        taux_presence = round((present_count / total_pointages) * 100) if total_pointages > 0 else 0
        taux_absence = round((absent_count / total_pointages) * 100) if total_pointages > 0 else 0
        taux_retard = round((retard_count / total_pointages) * 100) if total_pointages > 0 else 0
        
        return Response({
            "departement": dep.nom,
            "structure": {
                "filieres": total_filieres,
                "groupes": total_groupes,
                "etudiants": total_etudiants,
            },
            "pointages": {
                "total": total_pointages,
                "present": present_count,
                "absent": absent_count,
                "retard": retard_count,
            },
            "absences": {
                "justifiees": justified_count,
                "non_justifiees": unjustified_count,
            },
            "taux": {
                "presence": taux_presence,
                "absence": taux_absence,
                "retard": taux_retard
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({"INTERNAL SERVER ERROR": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAdminRole])
def get_filiere_groupes(request, id):
    try:
        try:
            filiere = Filiere.objects.get(id=id)
        except Filiere.DoesNotExist:
            return Response({"error": "Filière introuvable"}, status=status.HTTP_404_NOT_FOUND)
        groupes = filiere.groupes.all()
        ser = GroupeSerializer(groupes, many=True)
        return Response(ser.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"INTERNAL SERVER ERROR": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
def get_filtered_students(user):
    if user.role == 'ADMIN':
        return Utilisateur.objects.filter(role='ETUDIANT')
    elif user.role == 'PROF' and hasattr(user, 'prof_profile'):
        prof = user.prof_profile
        if prof.chef_de_departement:
            return Utilisateur.objects.filter(
                role='ETUDIANT',
                etudiant_profile__groupe__filiere__departement=prof.chef_de_departement
            )        
        elif prof.chef_de_filiere:
            return Utilisateur.objects.filter(
                role='ETUDIANT',
                etudiant_profile__groupe__filiere=prof.chef_de_filiere
            )
        else:
            return Utilisateur.objects.filter(
                role='ETUDIANT',
                etudiant_profile__groupe__filiere__modules__professeur=prof
            ).distinct()
    else:
        return Utilisateur.objects.none()
@api_view(['GET'])
@permission_classes([IsAdminRole | IsProfesseur])
def get_etudiants_premiere_annee(request):
    try:
        base_students = get_filtered_students(request.user)
        etudiants = base_students.filter(etudiant_profile__groupe__niveau=Groupe.Niveau.FIRST_YEAR).select_related('etudiant_profile__groupe')
        ser = EtudiantSerializer(etudiants, many=True)
        return Response(ser.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"INTERNAL SERVER ERROR": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
@api_view(['GET'])
@permission_classes([IsAdminRole | IsProfesseur])
def get_etudiants_deuxieme_annee(request):
    try:
        base_students = get_filtered_students(request.user)
        etudiants = base_students.filter(etudiant_profile__groupe__niveau=Groupe.Niveau.SECOND_YEAR).select_related('etudiant_profile__groupe')
        ser = EtudiantSerializer(etudiants, many=True)
        return Response(ser.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"INTERNAL SERVER ERROR": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
@api_view(['GET'])
@permission_classes([IsAdminRole | IsProfesseur])
def get_etudiants_bachelor(request):
    try:
        base_students = get_filtered_students(request.user)
        etudiants = base_students.filter(etudiant_profile__groupe__niveau=Groupe.Niveau.BACHELOR).select_related('etudiant_profile__groupe')
        type_formation = request.query_params.get('type')
        if type_formation:
            etudiants = etudiants.filter(etudiant_profile__groupe__type_formation=type_formation)
        ser = EtudiantSerializer(etudiants, many=True)
        return Response(ser.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"INTERNAL SERVER ERROR": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAdminRole | IsChefFiliere])
def filieres_stats(request, id):
    try:
        try:
            filiere = Filiere.objects.get(id=id)
        except Filiere.DoesNotExist:
            return Response({"error": "Filiere introuvable"}, status=status.HTTP_404_NOT_FOUND)
            
        user = request.user
        if user.role != 'ADMIN' and not (user.role == 'PROF' and hasattr(user, 'prof_profile') and getattr(user.prof_profile, 'chef_de_filiere', None) == filiere):
            return Response({"error": "Accès non autorisé"}, status=status.HTTP_403_FORBIDDEN)
            
        groupes = Groupe.objects.filter(filiere=filiere)
        etudiants = Etudiant.objects.filter(filiere=filiere)
        user_ids = etudiants.values_list('user_id', flat=True)
        pointages = Pointage.objects.filter(etudiant_id__in=user_ids)
        
        total_etudiants = etudiants.count()
        total_groupes = groupes.count()
        total_absences = pointages.filter(status='ABSENT').count()
        justifiees = pointages.filter(status='ABSENT', justification__etat='APPROUVE').count()
        
        # Calculate top groups
        top_groups = []
        for g in groupes:
            g_etudiants = etudiants.filter(groupe=g).values_list('user_id', flat=True)
            g_absences = pointages.filter(etudiant_id__in=g_etudiants, status='ABSENT').count()
            top_groups.append({"id": g.id, "nom": g.nom, "absences": g_absences})
        top_groups = sorted(top_groups, key=lambda x: x['absences'], reverse=True)[:5]
        
        # Calculate top students
        top_students = []
        for e in etudiants:
            e_abs = pointages.filter(etudiant_id=e.user.id, status='ABSENT').count()
            if e_abs > 0:
                e_just = pointages.filter(etudiant_id=e.user.id, status='ABSENT', justification__etat='APPROUVE').count()
                top_students.append({
                    "id": e.id,
                    "user": {
                        "last_name": e.user.last_name,
                        "first_name": e.user.first_name,
                    },
                    "groupe_nom": e.groupe.nom if e.groupe else "—",
                    "nb_absences": e_abs,
                    "nb_absences_justifiees": e_just
                })
        top_students = sorted(top_students, key=lambda x: x['nb_absences'], reverse=True)[:5]
        
        return Response({
            "totalEtudiants": total_etudiants,
            "totalGroupes": total_groupes,
            "totalAbsences": total_absences,
            "justifiees": justifiees,
            "topGroups": top_groups,
            "topStudents": top_students
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({"INTERNAL SERVER ERROR": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
@api_view(['GET'])
@permission_classes([IsProfesseur])
def get_professor_students(request):
    try:
        user = request.user
        if not hasattr(user, 'prof_profile'):
            return Response({"error": "Accès réservé aux professeurs."}, status=status.HTTP_403_FORBIDDEN)
        
        prof = user.prof_profile
        
        # Get all modules assigned to this professor
        modules = Module.objects.filter(professeur=prof).select_related('filiere')
        
        results = []
        for module in modules:
            # Find groups that have sessions (Seance) for this module and professor
            groupes = Groupe.objects.filter(seance__module=module, seance__professeur=prof).distinct()
            
            for groupe in groupes:
                students = Etudiant.objects.filter(groupe=groupe).select_related('user')
                student_list = []
                for student in students:
                    # Count absences for this student in this module (using PresenceProf)
                    absences = PresenceProf.objects.filter(
                        etudiant=student.user,
                        seance__module=module,
                        status='ABSENT'
                    ).count()
                    
                    # Count justified absences (where status is ABSENT but a justification exists and is approved)
                    # Note: In some parts of the system, status becomes PRESENT when approved.
                    # We should check both cases or rely on the justification etat.
                    # Based on attendance/views.py: "j.etat = decision; j.save(); if decision == 'APPROUVE' and presence.status == 'ABSENT': presence.status = 'PRESENT'; presence.save()"
                    # So if approved, status is PRESENT. 
                    # But the user asked for "number of absence". Usually this means unjustified absences or total?
                    # Let's provide both.
                    
                    justifiees = Justification.objects.filter(
                        presence_prof__etudiant=student.user,
                        presence_prof__seance__module=module,
                        etat='APPROUVE'
                    ).count()
                    
                    student_list.append({
                        "id": student.id,
                        "full_name": f"{student.user.last_name} {student.user.first_name}",
                        "email": student.user.email,
                        "cne": student.cne,
                        "nb_absences": absences,
                        "nb_justifiees": justifiees
                    })
                
                results.append({
                    "module_id": module.id,
                    "module_nom": module.nom,
                    "groupe_id": groupe.id,
                    "groupe_nom": groupe.nom,
                    "students": student_list
                })
        
        return Response(results, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"INTERNAL SERVER ERROR": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
