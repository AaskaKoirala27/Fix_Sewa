
from django.http import JsonResponse
from rest_framework.decorators import api_view

@api_view(["GET"])
def api_root(request):
	return JsonResponse({"message": "Hello from Django API!"})
