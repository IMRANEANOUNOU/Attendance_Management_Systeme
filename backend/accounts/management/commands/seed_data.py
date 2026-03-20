from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from academic.models import Departement, Filiere, Groupe, Module, Salle
from accounts.models import Professeur, Etudiant
from schedule.models import Seance
from attendance.models import PresenceProf, Justification, Pointage
from django.utils import timezone
from datetime import timedelta, time
import random

User = get_user_model()

class Command(BaseCommand):
    help = 'Wipe database and seed with structured academic data (1 Dept, 2 Filieres, 16 Profs)'

    def handle(self, *args, **kwargs):
        self.stdout.write('Wiping data...')
        
        # Order matters due to foreign keys
        Justification.objects.all().delete()
        Pointage.objects.all().delete()
        PresenceProf.objects.all().delete()
        Seance.objects.all().delete()
        Module.objects.all().delete()
        Etudiant.objects.all().delete()
        Professeur.objects.all().delete()
        Groupe.objects.all().delete()
        Filiere.objects.all().delete()
        Departement.objects.all().delete()
        Salle.objects.all().delete()
        User.objects.all().delete()

        self.stdout.write('Creating new structured data...')

        # 1. Superuser
        User.objects.create_superuser('admin', 'admin@example.com', '12345', role='ADMIN')
        self.stdout.write('Created Superuser: admin / 12345')

        # 2. Création des 16 Professeurs (incluant les chefs)
        profs = []
        for i in range(1, 17):
            if i == 1:
                u_name, f_name, l_name = 'chefDept', 'Chef', 'Departement'
            elif i == 2:
                u_name, f_name, l_name = 'chefGI', 'Chef', 'GenieInfo'
            elif i == 3:
                u_name, f_name, l_name = 'chefIDSD', 'Chef', 'IDSD'
            else:
                u_name, f_name, l_name = f'prof{i}', f'Prenom{i}', f'Nom{i}'
            
            u = User.objects.create_user(username=u_name, email=f'{u_name}@gmail.com', password='12345', 
                                         first_name=f_name, last_name=l_name, role="PROF")
            p = Professeur.objects.create(user=u, matricule=f"P10{i:02d}", specialite="Informatique")
            profs.append(p)
        
        chef_dept, chef_gi, chef_idsd = profs[0], profs[1], profs[2]
        self.stdout.write(f'Created 16 Professors (including {chef_dept.user.username}, {chef_gi.user.username}, {chef_idsd.user.username})')

        # 3. Département & Filières
        info_dept = Departement.objects.create(nom="Informatique", description="Département Informatique", chef=chef_dept)
        
        gi = Filiere.objects.create(nom="Génie Informatique", type_diplome="DUT", departement=info_dept, chef=chef_gi)
        idsd = Filiere.objects.create(nom="IDSD", type_diplome="DUT", departement=info_dept, chef=chef_idsd)
        self.stdout.write('Created 1 Department and 2 Filieres (GI & IDSD)')

        # 4. Groupes (2 pour GI, 2 pour IDSD)
        gi_g1 = Groupe.objects.create(nom="GI-G1", filiere=gi, niveau="1ERE", type_formation="FI")
        gi_g2 = Groupe.objects.create(nom="GI-G2", filiere=gi, niveau="1ERE", type_formation="FI")
        idsd_g1 = Groupe.objects.create(nom="IDSD-G1", filiere=idsd, niveau="1ERE", type_formation="FI")
        idsd_g2 = Groupe.objects.create(nom="IDSD-G2", filiere=idsd, niveau="1ERE", type_formation="FI")
        
        all_groups = [gi_g1, gi_g2, idsd_g1, idsd_g2]

        # 5. Salles
        salles = [Salle.objects.create(nom=f"Salle {i}", capacite=40, latitude=33.5, longitude=-7.6) for i in range(1, 11)]

        # 6. Modules (8 pour GI, 8 pour IDSD)
        gi_modules = []
        for i in range(1, 9):
            prof_assign = profs[i % 16] # Répartition équitable des profs
            gi_modules.append(Module.objects.create(nom=f"Module GI {i}", code=f"MGI{i}", filiere=gi, professeur=prof_assign))
            
        idsd_modules = []
        for i in range(1, 9):
            prof_assign = profs[(i+8) % 16] # Répartition pour IDSD
            idsd_modules.append(Module.objects.create(nom=f"Module IDSD {i}", code=f"MIDSD{i}", filiere=idsd, professeur=prof_assign))

        # 7. Création des 120 Étudiants (30 par groupe)
        def create_students(groupe, count, start_cne):
            students = []
            for i in range(count):
                u_name = f'student_{groupe.nom.lower().replace("-","")}_{i+1}'
                u = User.objects.create_user(username=u_name, email=f'{u_name}@gmail.com', password='12345', 
                                             first_name=f"Etudiant{i+1}", last_name=groupe.nom, role="ETUDIANT")
                e = Etudiant.objects.create(user=u, cne=f"CNE{start_cne+i}", groupe=groupe, filiere=groupe.filiere)
                students.append(e)
            return students

        students_by_group = {
            gi_g1: create_students(gi_g1, 30, 1000),
            gi_g2: create_students(gi_g2, 30, 2000),
            idsd_g1: create_students(idsd_g1, 30, 3000),
            idsd_g2: create_students(idsd_g2, 30, 4000)
        }
        self.stdout.write('Created 120 Students (30 per group)')

        # 8. Génération des Séances, Pointages et Absences (Statistics)
        self.stdout.write('Generating realistic Schedule and Attendance data...')
        
        now_dt = timezone.localtime()
        today = now_dt.date()
        start_date = today - timedelta(days=21) # 3 semaines en arrière pour les stats
        end_date = today + timedelta(days=7)    # 1 semaine dans le futur

        current_date = start_date
        while current_date <= end_date:
            day_name = current_date.strftime('%A').upper()
            day_map = {
                'MONDAY': 'LUNDI', 'TUESDAY': 'MARDI', 'WEDNESDAY': 'MERCREDI',
                'THURSDAY': 'JEUDI', 'FRIDAY': 'VENDREDI', 'SATURDAY': 'SAMEDI'
            }
            dj_day = day_map.get(day_name)
            
            if dj_day and dj_day != 'SAMEDI': # Pas de cours le samedi pour simplifier
                is_past = current_date < today
                status_seance = "CLOTUREE" if is_past else "PROGRAMMEE"

                # Pour chaque groupe, on programme 2 séances par jour
                for idx, groupe in enumerate(all_groups):
                    # Sélectionner les modules correspondants (GI ou IDSD)
                    mods = gi_modules if "GI" in groupe.nom else idsd_modules
                    
                    # 1ère séance (Matin 08h-10h)
                    # We reuse séances if they already exist for this group/day/time
                    h_start, h_end = time(8,0), time(10,0)
                    s1, created = Seance.objects.get_or_create(
                        jour=dj_day, heure_debut=h_start, heure_fin=h_end, groupe=groupe,
                        defaults={
                            'professeur': random.choice(mods).professeur, 
                            'module': random.choice(mods), 
                            'salle': random.choice(salles),
                            'statut_seance': status_seance,
                            'seance_id': random.randint(10000, 99999)
                        }
                    )
                    if not created and not is_past:
                         # Ensure future seance has correct status if today or future
                         s1.statut_seance = status_seance
                         s1.save()

                    if is_past:
                        self.generate_attendance(s1, students_by_group[groupe], current_date, past=is_past)

                    # 2ème séance (Après-midi 14h-16h)
                    h_start2, h_end2 = time(14,0), time(16,0)
                    s2, created2 = Seance.objects.get_or_create(
                        jour=dj_day, heure_debut=h_start2, heure_fin=h_end2, groupe=groupe,
                        defaults={
                            'professeur': random.choice(mods).professeur, 
                            'module': random.choice(mods), 
                            'salle': random.choice(salles),
                            'statut_seance': status_seance,
                            'seance_id': random.randint(10000, 99999)
                        }
                    )
                    if not created2 and not is_past:
                         s2.statut_seance = status_seance
                         s2.save()

                    if is_past:
                        self.generate_attendance(s2, students_by_group[groupe], current_date, past=is_past)

            current_date += timedelta(days=1)

        self.stdout.write(self.style.SUCCESS('Successfully seeded database with rich statistics!'))

    def generate_attendance(self, seance, students, date_obj, past=False):
        if not past:
            return

        # Probabilités réalistes : ~80% Présent, ~15% Absent, ~5% Retard
        status_choices = ['PRESENT']*8 + ['ABSENT']*2 + ['RETARD']
        
        for student in students:
            status_val = random.choice(status_choices)
            method = random.choice(['face_id', 'manual']) if status_val == 'PRESENT' else None
            
            try:
                presence = PresenceProf.objects.create(
                    seance=seance,
                    etudiant=student.user,
                    date=date_obj,
                    status=status_val,
                    method=method or 'manual'
                )
            except Exception as e:
                self.stdout.write(self.style.WARNING(f"Error creating PresenceProf: {e}"))
                continue

            # Pointage
            p = Pointage.objects.create(
                etudiant=student.user,
                seance_id=seance.id,
                status=status_val,
                photo_preuve='pointages/dummy.jpg',
                latitude=33.5,
                longitude=-7.6,
                score_ai=0.9 if status_val=='PRESENT' else 0.0
            ) 
            
            p.date_heure = timezone.make_aware(timezone.datetime.combine(date_obj, seance.heure_debut))
            p.save()

            # Justification (40% de chance de justifier une absence)
            if status_val == 'ABSENT':
                if random.random() < 0.40:
                    Justification.objects.create(
                        presence_prof=presence,
                        motif=random.choice(["Maladie", "Urgence familiale", "Transport"]),
                        fichier="justifications/ordonnance.pdf",
                        etat=random.choice(['EN_ATTENTE', 'APPROUVE', 'APPROUVE', 'REFUSE']),
                    )