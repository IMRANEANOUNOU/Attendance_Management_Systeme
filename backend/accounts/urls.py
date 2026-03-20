from django.urls import path
from . import views 
urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('register/etudiant/',views.register_etudiant,name='register_etudiant'),
    path('register/professeur/',views.register_professeur,name='register_professeur'),
    path('utilisateurs/',views.get_utilisateurs,name='list_utilisateurs'),
    path('etudiants/',views.get_etudiants,name='list_etudiants'),
    path('professeurs/',views.get_professeur,name='list_professeurs'),
    path('update/<int:id>/', views.update_user, name='update_user'),
    path('delete/<int:id>/', views.delete_user, name='delete_user'),
    path('password/reset/admin/<int:id>/',views.admin_change_password, name='admin_change_password'),
    path('password/change/',views.user_change_password, name='user_change_password'),
    path('dashboard/admin/stats/',views.dashbord_admin_stats, name='dashbord_admin_stats'),
    path('student-profile/', views.student_profile_view, name='student_profile'),
    path('departements/<int:id>/professeurs/', views.get_department_professors, name='get_department_professors'),
    path('password-reset/', views.request_password_reset, name='request_password_reset'),
    path('password-reset-confirm/<str:uidb64>/<str:token>/', views.reset_password_confirm, name='reset_password_confirm'),
    path('complete-tour/', views.complete_tour, name='complete_tour'),
]