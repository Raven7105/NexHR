from django.apps import AppConfig


class LeavesConfig(AppConfig):
    name = 'apps.leaves'

    def ready(self):
        import apps.leaves.signals