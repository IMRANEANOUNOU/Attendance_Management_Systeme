from django.contrib import admin
from .models import Departement, Groupe, Filiere, Module  # أضف باقي المودلز إذا أردت

admin.site.register(Departement)
admin.site.register(Groupe)
admin.site.register(Filiere)
admin.site.register(Module)