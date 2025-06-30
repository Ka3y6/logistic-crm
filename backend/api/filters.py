from django_filters import rest_framework as filters

from .models import Carrier, Client


class ClientFilter(filters.FilterSet):
    company_name = filters.CharFilter(lookup_expr="icontains")
    working_directions = filters.CharFilter(lookup_expr="icontains")
    location = filters.CharFilter(lookup_expr="icontains")
    created_at = filters.DateFromToRangeFilter()
    updated_at = filters.DateFromToRangeFilter()

    class Meta:
        model = Client
        fields = ["company_name", "working_directions", "location", "created_at", "updated_at"]


class CarrierFilter(filters.FilterSet):
    company_name = filters.CharFilter(lookup_expr="icontains")
    working_directions = filters.CharFilter(lookup_expr="icontains")
    location = filters.CharFilter(lookup_expr="icontains")
    created_at = filters.DateFromToRangeFilter()
    updated_at = filters.DateFromToRangeFilter()

    class Meta:
        model = Carrier
        fields = ["company_name", "working_directions", "location", "created_at", "updated_at"]
