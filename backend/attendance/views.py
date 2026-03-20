import math
import face_recognition
import numpy as np
from django.shortcuts import render
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser

from datetime import datetime, date as date_mod

from accounts.permissions import IsProfesseur
from schedule.models import Seance
from .models import Pointage, PresenceProf, Justification
from academic.models import Groupe
from accounts.models import Utilisateur


def _seance_is_over(seance, check_date=None):
    """Return True if the seance's heure_fin has passed for the given date (default=today)."""
    now = timezone.now()
    if check_date is None:
        check_date = now.date()
    heure_fin_dt = timezone.make_aware(datetime.combine(check_date, seance.heure_fin))
    return now > heure_fin_dt


class MarquerPresenceView(APIView) :
    def calculer_distance(self,lat1,long1,lat2,long2) :
        rayon_du_terre = 6371000
        p1 = math.radians(lat1)
        p2 = math.radians(lat2)
        delta_p = math.radians(lat2-lat1)
        delta_l = math.radians(long2-long1)

        a = math.sin(delta_p/2)**2 +\
            math.cos(p1)*math.cos(p2) *\
            math.sin(delta_l/2)**2
        

        c = 2*math.atan2(math.sqrt(a),math.sqrt(1-a))


        return rayon_du_terre*c
    
    def post(self,request):
        latitude_etudiant = float(request.data.get('latitude'))
        longitude_etudiant = float(request.data.get('longitude'))
        seance_id = request.data.get('seance_id')
        photo_upload = request.FILES.get('photo')



        try:
             seance = Seance.objects.select_related('salle').get(id=seance_id)
        except Seance.DoesNotExist:
             return Response({"success": False, "message": "Séance introuvable !"}, status=status.HTTP_404_NOT_FOUND)

        # ── Time check: reject if session has ended ──
        if _seance_is_over(seance):
            return Response(
                {"success": False, "message": "La séance est terminée. Le pointage est clos."},
                status=status.HTTP_403_FORBIDDEN
            )

        if not seance.salle:
             return Response({"success": False, "message": "Aucune salle associée à cette séance !"}, status=status.HTTP_400_BAD_REQUEST)

        # Get Salle coordinates
        lat_salle = seance.salle.latitude
        lgt_salle = seance.salle.longitude
        rayon_autoriser = seance.salle.rayon or 50 # Default to 50m if not set


        distance = self.calculer_distance(latitude_etudiant,longitude_etudiant,lat_salle,lgt_salle)
        if distance > rayon_autoriser :
            return Response({"success" : False,"message" : "zone non autoriser !"},status=status.HTTP_400_BAD_REQUEST)
        

        #bach anst3mel AI gh detection n face ikhassagh an installer face_recognition sgh numpy


        current_user = request.user

        if not hasattr(current_user,'etudiant_profile') :
            return Response({"success":False,"message" : "Utilisateur non autoriser !"},status=status.HTTP_400_BAD_REQUEST)
        
        etudiant_profile = current_user.etudiant_profile

        if not etudiant_profile.photo_profile :
            return Response({"success":False,"message" : "Utilisateur sans photo profile!"},status=status.HTTP_400_BAD_REQUEST)
        if not photo_upload :
                return Response({"success" : False,"message" : "selfi not found !"},status=status.HTTP_400_BAD_REQUEST)
            
        try :
                primitive_image = face_recognition.load_image_file(etudiant_profile.photo_profile.path)
                selfi = face_recognition.load_image_file(photo_upload)

                primitive_image_encodings = face_recognition.face_encodings(primitive_image)

                if not primitive_image_encodings :
                    return Response({"success" : False,"message" : "no face detected !"},status=status.HTTP_400_BAD_REQUEST)
                
                primitive_image_encoding = primitive_image_encodings[0] # achko face_reco arditlddi list les tableaux n faces li illan gh l'image , nkkni arntassi lwl 

                selfi_encodings = face_recognition.face_encodings(selfi)
                if not selfi_encodings: #ghid ighorilli hta kran odm (face z3ma haha)
                    return Response({"success" : False,"message" : "no face detected !"},status=status.HTTP_400_BAD_REQUEST)
                selfi_encoding = selfi_encodings[0]


                resultats = face_recognition.compare_faces([primitive_image_encoding],selfi_encoding,tolerance=0.6) #tolerance gid z3ma degree n sarama 0.6 nttat ayfolkin .
                
                # resultats ya2imma [True] or [False]
                if resultats[0] :
                    face_distance = face_recognition.face_distance([primitive_image_encoding],selfi_encoding)[0]
                    score_ai = 1-face_distance


                    pointage = Pointage.objects.create(
                        etudiant = request.user,
                        seance_id = seance_id,
                        photo_preuve = photo_upload,
                        latitude = latitude_etudiant,
                        longitude = longitude_etudiant,
                        score_ai = score_ai,
                        status= 'PRESENT'
                    )

                    return Response({"success": True,"message" : "Pointage fait avec succes !","score":round(score_ai,2)},status=status.HTTP_201_CREATED)
                else :
                    return Response({"success": False, "message": "Visage non reconnu!"}, status=status.HTTP_400_BAD_REQUEST)
        

        except Exception as e :
            print(f"Erreur : {e}")
            return Response({"success": False, "message": f"Erreur de serveur : {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ProfPresenceView(APIView):
    """Professor: submit or retrieve attendance for a session (by date)."""
    permission_classes = [IsAuthenticated, IsProfesseur]

    def get(self, request):
        """Get existing attendance for a session on a given date."""
        seance_id = request.query_params.get("seance_id")
        date_str = request.query_params.get("date")
        if not seance_id or not date_str:
            return Response(
                {"error": "seance_id and date are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            seance = Seance.objects.get(pk=seance_id)
        except (ValueError, Seance.DoesNotExist):
            return Response({"error": "Séance introuvable"}, status=status.HTTP_404_NOT_FOUND)
        if not request.user.prof_profile or seance.professeur_id != request.user.prof_profile.id:
            return Response({"error": "Vous n'êtes pas le professeur de cette séance"}, status=status.HTTP_403_FORBIDDEN)
        try:
            date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            return Response({"error": "Date invalide (format: YYYY-MM-DD)"}, status=status.HTTP_400_BAD_REQUEST)
        # 1. Get official professor records
        presences = PresenceProf.objects.filter(seance=seance, date=date).select_related("etudiant")
        
        # 2. Get student scans (pointages) for this session and date
        pointages = Pointage.objects.filter(seance_id=seance.id, date_heure__date=date)
        
        # Merge them: PresenceProf takes priority over Pointage
        lines_mapping = {}

        # Build a set of students who scanned via Face ID
        face_scanned = set()
        for p in pointages:
            face_scanned.add(p.etudiant_id)
            lines_mapping[p.etudiant_id] = {
                "etudiant_id": p.etudiant_id,
                "status": p.status,
                "method": "face_id"
            }

        # Then, overwrite with official professor records
        # But preserve 'face_id' method if the student actually scanned
        for p in presences:
            method = p.method  # what was saved in PresenceProf
            if not method and p.etudiant_id in face_scanned:
                method = "face_id"  # preserve Face ID origin
            lines_mapping[p.etudiant_id] = {
                "etudiant_id": p.etudiant_id,
                "status": p.status,
                "method": method or "manual"
            }

        lines = list(lines_mapping.values())

        # ── Smart status for recurring weekly sessions ──
        # If the seance is marked CLOTUREE in the database but has NO attendance
        # records for TODAY, it means the last close was from a previous week.
        # Report as PROGRAMMEE so the professor can start a fresh occurrence.
        effective_status = seance.statut_seance
        if effective_status == 'CLOTUREE' and not lines:
            effective_status = 'PROGRAMMEE'

        # Also: if EN_COURS but time is already over and no lines yet → still EN_COURS
        # (Let the professor decide to stop, don't auto-lock them out)
        is_time_over = _seance_is_over(seance, date)

        return Response({
            "seance_id": seance_id,
            "date": date_str,
            "statut_seance": effective_status,
            "is_time_over": is_time_over,
            "lines": lines
        }, status=status.HTTP_200_OK)

    def post(self, request):
        """Save attendance for a session on a given date. Body: { seance_id, date, lines: [{ etudiant_id, status }] }."""
        seance_id = request.data.get("seance_id")
        date_str = request.data.get("date")
        lines = request.data.get("lines")
        if not seance_id or not date_str or not isinstance(lines, list):
            return Response(
                {"error": "seance_id, date and lines (array) are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            seance = Seance.objects.select_related("groupe").get(pk=seance_id)
        except (ValueError, Seance.DoesNotExist):
            return Response({"error": "Séance introuvable"}, status=status.HTTP_404_NOT_FOUND)
        if not hasattr(request.user, "prof_profile") or seance.professeur_id != request.user.prof_profile.id:
            return Response({"error": "Vous n'êtes pas le professeur de cette séance"}, status=status.HTTP_403_FORBIDDEN)
        try:
            date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except (ValueError, TypeError):
            return Response({"error": "Date invalide (format: YYYY-MM-DD)"}, status=status.HTTP_400_BAD_REQUEST)

        # ── Block saving only if the session was deliberately clôturée by the prof ──
        # We no longer block based on clock time alone, because the prof may need
        # to save attendance after the session's scheduled end.
        if seance.statut_seance == 'CLOTUREE':
            return Response(
                {"error": "La séance est clôturée. Impossible de modifier les présences."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Students that belong to this session's group (user ids)
        from accounts.models import Utilisateur
        allowed_user_ids = set(
            Utilisateur.objects.filter(etudiant_profile__groupe=seance.groupe).values_list("id", flat=True)
        )
        valid_statuses = {"PRESENT", "ABSENT", "RETARD"}
        valid_methods = {"face_id", "manual"}
        to_create = []
        for item in lines:
            etudiant_id = item.get("etudiant_id")
            status_val = (item.get("status") or "PRESENT").upper()
            method_val = item.get("method") or None
            if status_val not in valid_statuses:
                status_val = "PRESENT"
            if method_val and method_val not in valid_methods:
                method_val = None
            if etudiant_id not in allowed_user_ids:
                continue
            to_create.append(
                PresenceProf(seance=seance, date=date, etudiant_id=etudiant_id, status=status_val, method=method_val)
            )
        # Replace all presences for this seance+date
        PresenceProf.objects.filter(seance=seance, date=date).delete()
        PresenceProf.objects.bulk_create(to_create)
        return Response(
            {"success": True, "message": "Présences enregistrées.", "count": len(to_create)},
            status=status.HTTP_201_CREATED,
        )


class MesAbsencesView(APIView):
    """Student: get their full attendance history with justification status."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not hasattr(user, 'etudiant_profile'):
            return Response({"error": "Accès réservé aux étudiants."}, status=status.HTTP_403_FORBIDDEN)

        etudiant_profile = user.etudiant_profile
        groupe = etudiant_profile.groupe

        if not groupe:
            return Response({"records": [], "stats": {"total": 0, "absences": 0, "justifiees": 0}})

        # Get all PresenceProf records for this student
        presences = PresenceProf.objects.filter(
            etudiant=user
        ).select_related('seance', 'seance__module').order_by('-date', '-seance__heure_debut')

        records = []
        total_absences = 0
        total_justifiees = 0

        for p in presences:
            # Check if justification exists
            justification_data = None
            try:
                j = p.justification
                justification_data = {
                    "id": j.id,
                    "motif": j.motif,
                    "etat": j.etat,
                    "date_soumission": j.date_soumission.isoformat(),
                }
                if j.etat == 'APPROUVE':
                    total_justifiees += 1
            except Justification.DoesNotExist:
                pass

            if p.status == 'ABSENT':
                total_absences += 1

            records.append({
                "id": p.id,
                "date": p.date.isoformat(),
                "heure_debut": p.seance.heure_debut.strftime("%H:%M") if p.seance else None,
                "heure_fin": p.seance.heure_fin.strftime("%H:%M") if p.seance else None,
                "module_nom": p.seance.module.nom if p.seance and p.seance.module else "—",
                "type_seance": p.seance.type_seance if p.seance else "—",
                "status": p.status,
                "method": p.method,
                "justification": justification_data,
            })

        return Response({
            "records": records,
            "stats": {
                "total": len(records),
                "absences": total_absences,
                "justifiees": total_justifiees,
            }
        })


class JustifierAbsenceView(APIView):
    """Student: submit a justification for an absence."""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        user = request.user
        if not hasattr(user, 'etudiant_profile'):
            return Response({"error": "Accès réservé aux étudiants."}, status=status.HTTP_403_FORBIDDEN)

        presence_prof_id = request.data.get('presence_prof_id')
        motif = request.data.get('motif', '')
        fichier = request.FILES.get('fichier')

        if not presence_prof_id:
            return Response({"error": "presence_prof_id est requis."}, status=status.HTTP_400_BAD_REQUEST)

        if not fichier:
            return Response({"error": "Un fichier justificatif est requis."}, status=status.HTTP_400_BAD_REQUEST)

        if not motif.strip():
            return Response({"error": "Le motif est requis."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            presence = PresenceProf.objects.get(pk=presence_prof_id, etudiant=user, status='ABSENT')
        except PresenceProf.DoesNotExist:
            return Response({"error": "Absence introuvable ou vous n'êtes pas concerné."}, status=status.HTTP_404_NOT_FOUND)

        # Check if justification already exists
        if hasattr(presence, 'justification'):
            return Response({"error": "Une justification a déjà été soumise pour cette absence."}, status=status.HTTP_400_BAD_REQUEST)

        justification = Justification.objects.create(
            presence_prof=presence,
            motif=motif.strip(),
            fichier=fichier,
            etat='EN_ATTENTE',
        )

        return Response({
            "success": True,
            "message": "Justification soumise avec succès.",
            "justification": {
                "id": justification.id,
                "etat": justification.etat,
                "date_soumission": justification.date_soumission.isoformat(),
            }
        }, status=status.HTTP_201_CREATED)


class ChefJustificationsView(APIView):
    """
    Chef de filière / département: lister les justificatifs EN_ATTENTE
    pour les étudiants de leur périmètre.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != "PROF" or not hasattr(user, "prof_profile"):
            return Response({"error": "Accès réservé aux professeurs."}, status=status.HTTP_403_FORBIDDEN)

        prof = user.prof_profile

        # Determine perimeter: filiere or departement
        filiere = getattr(prof, "chef_de_filiere", None)
        departement = getattr(prof, "chef_de_departement", None)

        if not filiere and not departement:
            return Response(
                {"error": "Accès réservé aux chefs de filière ou de département."},
                status=status.HTTP_403_FORBIDDEN,
            )

        qs = Justification.objects.filter(etat="EN_ATTENTE").select_related(
            "presence_prof__etudiant",
            "presence_prof__seance__groupe",
            "presence_prof__seance__module",
        )

        results = []
        for j in qs:
            presence = j.presence_prof
            if not presence or not presence.seance or not presence.seance.groupe:
                continue
            g = presence.seance.groupe
            fil = g.filiere

            if filiere and fil != filiere:
                continue
            if departement and fil.departement != departement:
                continue

            etu = presence.etudiant
            etu_name = f"{etu.last_name} {etu.first_name}".strip() or etu.email

            fichier_url = j.fichier.url if j.fichier and hasattr(j.fichier, "url") else None

            results.append(
                {
                    "id": j.id,
                    "presence_prof_id": presence.id,
                    "etudiant_nom": etu_name,
                    "groupe_nom": g.nom,
                    "date": presence.date.isoformat(),
                    "fichier_url": fichier_url,
                    "etat": j.etat,
                }
            )

        return Response(results, status=status.HTTP_200_OK)


class ChefTraiterJustificationView(APIView):
    """
    Chef de filière / département: approuver ou refuser une justification.
    Body: { justification_id, decision: "APPROUVE" | "REFUSE" }
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.role != "PROF" or not hasattr(user, "prof_profile"):
            return Response({"error": "Accès réservé aux professeurs."}, status=status.HTTP_403_FORBIDDEN)

        prof = user.prof_profile
        filiere = getattr(prof, "chef_de_filiere", None)
        departement = getattr(prof, "chef_de_departement", None)
        if not filiere and not departement:
            return Response(
                {"error": "Accès réservé aux chefs de filière ou de département."},
                status=status.HTTP_403_FORBIDDEN,
            )

        justification_id = request.data.get("justification_id")
        decision = (request.data.get("decision") or "").upper()

        if not justification_id or decision not in {"APPROUVE", "REFUSE"}:
            return Response(
                {"error": "Paramètres invalides."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            j = Justification.objects.select_related(
                "presence_prof__seance__groupe__filiere__departement",
                "presence_prof__etudiant",
            ).get(pk=justification_id)
        except Justification.DoesNotExist:
            return Response({"error": "Justification introuvable."}, status=status.HTTP_404_NOT_FOUND)

        presence = j.presence_prof
        if not presence or not presence.seance or not presence.seance.groupe:
            return Response({"error": "Justification non liée à une absence valide."}, status=status.HTTP_400_BAD_REQUEST)

        fil = presence.seance.groupe.filiere
        if filiere and fil != filiere:
            return Response({"error": "Accès non autorisé à cette justification."}, status=status.HTTP_403_FORBIDDEN)
        if departement and fil.departement != departement:
            return Response({"error": "Accès non autorisé à cette justification."}, status=status.HTTP_403_FORBIDDEN)

        j.etat = decision
        j.save(update_fields=["etat"])

        # Optionnel : marquer l'absence comme justifiée => PRESENT si approuvée
        if decision == "APPROUVE" and presence.status == "ABSENT":
            presence.status = "PRESENT"
            presence.save(update_fields=["status"])

        return Response(
            {
                "success": True,
                "message": "Justification mise à jour.",
                "etat": j.etat,
            },
            status=status.HTTP_200_OK,
        )

class AdminEtudiantAbsencesView(APIView):
    """Admin: get the full absence history for a specific student."""
    permission_classes = [IsAuthenticated]

    def get(self, request, etudiant_id):
        user = request.user
        if user.role not in ["ADMIN", "PROF", "CHEF_DEPARTEMENT", "CHEF_FILIERE"]:
            return Response({"error": "Accès non autorisé."}, status=status.HTTP_403_FORBIDDEN)

        try:
            etudiant = Utilisateur.objects.get(id=etudiant_id)
        except Utilisateur.DoesNotExist:
            return Response({"error": "Étudiant introuvable."}, status=status.HTTP_404_NOT_FOUND)

        # Get all PresenceProf records for this student where status is ABSENT
        presences = PresenceProf.objects.filter(
            etudiant=etudiant, status='ABSENT'
        ).select_related('seance', 'seance__module').order_by('-date', '-seance__heure_debut')

        records = []

        for p in presences:
            justification_data = None
            try:
                j = p.justification
                justification_data = {
                    "id": j.id,
                    "motif": j.motif,
                    "etat": j.etat,
                    "date_soumission": j.date_soumission.isoformat(),
                }
            except Justification.DoesNotExist:
                pass

            records.append({
                "id": p.id,
                "date": p.date.isoformat(),
                "heure_debut": p.seance.heure_debut.strftime("%H:%M") if p.seance else None,
                "heure_fin": p.seance.heure_fin.strftime("%H:%M") if p.seance else None,
                "module_nom": p.seance.module.nom if p.seance and p.seance.module else "—",
                "type_seance": p.seance.type_seance if p.seance else "—",
                "status": p.status,
                "method": p.method,
                "justification": justification_data,
            })

        return Response({
            "records": records,
            "stats": {
                "total": len(records),
            }
        })
