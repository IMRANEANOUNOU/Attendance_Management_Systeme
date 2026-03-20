from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from academic.models import Departement, Filiere, Groupe, Module, Salle
from accounts.models import Professeur, Etudiant
from schedule.models import Seance
from attendance.models import PresenceProf, Justification, Pointage
from rest_framework.authtoken.models import Token

User = get_user_model()


class Command(BaseCommand):
    help = 'Wipe database and seed with ONE Admin + ONE Prof + ONE Student (for easy testing)'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING('⚠  Wiping ALL data from database…'))

        # Delete in dependency order
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
        Token.objects.all().delete()
        User.objects.all().delete()

        self.stdout.write('✓ Database wiped.\n')

        # ── 1. Admin ──────────────────────────────────────────────────────
        admin = User.objects.create_superuser(
            username='admin',
            email='admin@test.com',
            password='admin123',
            first_name='Admin',
            last_name='System',
            role='ADMIN'
        )
        self.stdout.write(self.style.SUCCESS(
            '✓ Admin created:    admin@test.com  /  admin123'
        ))

        # ── 2. Département ────────────────────────────────────────────────
        dept = Departement.objects.create(
            nom='Informatique',
            description='Département Informatique'
        )

        # ── 3. Filière ────────────────────────────────────────────────────
        filiere = Filiere.objects.create(
            nom='Génie Informatique',
            type_diplome='DUT',
            departement=dept,
            description='Filière Génie Informatique'
        )

        # ── 4. Groupe ─────────────────────────────────────────────────────
        groupe = Groupe.objects.create(
            nom='G1',
            filiere=filiere,
            niveau='1ERE',
            type_formation='FI'
        )

        # ── 5. Salle (large radius so GPS always passes in testing) ───────
        salle = Salle.objects.create(
            nom='Salle A',
            capacite=40,
            latitude=33.5731104,
            longitude=-7.5898434,
            rayon=50000.0   # 50 km — GPS always valid during tests
        )

        # ── 6. Professeur ─────────────────────────────────────────────────
        prof_user = User.objects.create_user(
            username='prof_test',
            email='prof@test.com',
            password='prof123',
            first_name='Ahmed',
            last_name='Professeur',
            role='PROF'
        )
        prof = Professeur.objects.create(
            user=prof_user,
            matricule='P001',
            specialite='Informatique',
            departement=dept
        )
        # Assign prof as chef de filière (optional, enables advanced features)
        filiere.chef = prof
        filiere.save()
        dept.chef = prof
        dept.save()
        self.stdout.write(self.style.SUCCESS(
            '✓ Prof created:     prof@test.com   /  prof123'
        ))

        # ── 7. Module ─────────────────────────────────────────────────────
        module = Module.objects.create(
            nom='Algorithmique',
            code='ALGO1',
            filiere=filiere,
            professeur=prof,
            semestre=1
        )

        # ── 8. Étudiant ───────────────────────────────────────────────────
        etud_user = User.objects.create_user(
            username='etudiant_test',
            email='etudiant@test.com',
            password='etud123',
            first_name='Mohammed',
            last_name='Etudiant',
            role='ETUDIANT'
        )
        etudiant = Etudiant.objects.create(
            user=etud_user,
            cne='TEST001',
            groupe=groupe,
            filiere=filiere,
            date_naissance=None,
            adresse='Casablanca, Maroc'
        )
        self.stdout.write(self.style.SUCCESS(
            '✓ Student created:  etudiant@test.com  /  etud123'
        ))

        # ── Summary ───────────────────────────────────────────────────────
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('═' * 52))
        self.stdout.write(self.style.SUCCESS('  ✅  Minimal seed complete!'))
        self.stdout.write(self.style.SUCCESS('═' * 52))
        self.stdout.write('')
        self.stdout.write('  Département : Informatique')
        self.stdout.write('  Filière     : Génie Informatique (DUT)')
        self.stdout.write('  Groupe      : G1 (1ère année, FI)')
        self.stdout.write('  Module      : Algorithmique (ALGO1)')
        self.stdout.write('  Salle       : Salle A (rayon=50km pour tests)')
        self.stdout.write('')
        self.stdout.write('  ┌─────────────────────────────────────────────┐')
        self.stdout.write('  │  ROLE     EMAIL                  MDP        │')
        self.stdout.write('  │  Admin    admin@test.com         admin123   │')
        self.stdout.write('  │  Prof     prof@test.com          prof123    │')
        self.stdout.write('  │  Student  etudiant@test.com      etud123    │')
        self.stdout.write('  └─────────────────────────────────────────────┘')
        self.stdout.write('')
        self.stdout.write(self.style.WARNING(
            '  ⚠  Student has NO profile photo — face recognition will return\n'
            '     "Utilisateur sans photo profile!" until one is uploaded.'
        ))
        self.stdout.write('')
