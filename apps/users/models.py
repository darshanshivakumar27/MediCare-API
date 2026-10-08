from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from apps.common.models import TimeStampedModel


class UserManager(BaseUserManager):
    """Custom manager for the User model with email as the unique identifier."""

    def create_user(self, email, name, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set.')
        if not name:
            raise ValueError('The Name field must be set.')

        email = self.normalize_email(email).lower()
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('is_staff', False)

        user = self.model(email=email, name=name, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, name, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, name, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin, TimeStampedModel):
    """
    Custom User model using email as the primary authentication identifier.
    """
    email = models.EmailField(
        verbose_name='Email address',
        max_length=255,
        unique=True,
        db_index=True,
    )
    name = models.CharField(
        verbose_name='Full name',
        max_length=150,
    )
    is_active = models.BooleanField(
        verbose_name='Active status',
        default=True,
    )
    is_staff = models.BooleanField(
        verbose_name='Staff status',
        default=False,
    )

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} <{self.email}>"
