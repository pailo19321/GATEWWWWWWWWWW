<?php

namespace App\Http\Controllers;

use App\Models\CompanyProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CompanyController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'business_type' => 'required|in:juridica,fisica',
            'document_number' => 'required|string',
            'business_name' => 'required|string',
            'invoice_name' => 'required|string|max:12',
            'average_revenue' => 'nullable|numeric',
            'average_ticket' => 'nullable|numeric',
            'company_website' => 'nullable|url',
            'products_sold' => 'nullable|string',
            'sells_physical_products' => 'boolean',
            'representative_name' => 'required|string',
            'representative_cpf' => 'required|string',
            'representative_email' => 'required|email',
            'representative_phone' => 'required|string',
            'date_of_birth' => 'required|string',
            'mother_name' => 'required|string',
            'postal_code' => 'required|string',
            'street' => 'required|string',
            'number' => 'required|string',
            'neighborhood' => 'required|string',
            'city' => 'required|string',
            'state' => 'required|string|max:2',
            'complement' => 'nullable|string',
            'document_frontal_url' => 'nullable|string',
            'document_back_url' => 'nullable|string',
            'document_selfie_url' => 'nullable|string',
            'document_contract_url' => 'nullable|string',
        ]);

        $user = Auth::user();
        $validated['user_id'] = $user->id;
        $validated['status'] = 'pending';

        try {
            $profile = CompanyProfile::create($validated);
            return response()->json($profile, 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Erro ao criar perfil da empresa'], 500);
        }
    }

    public function show()
    {
        $user = Auth::user();

        try {
            $profile = CompanyProfile::where('user_id', $user->id)->first();

            if (!$profile) {
                return response()->json(['profile' => null]);
            }

            return response()->json($profile);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Erro ao buscar perfil'], 500);
        }
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'business_type' => 'sometimes|in:juridica,fisica',
            'document_number' => 'sometimes|string',
            'business_name' => 'sometimes|string',
            'invoice_name' => 'sometimes|string|max:12',
            'average_revenue' => 'nullable|numeric',
            'average_ticket' => 'nullable|numeric',
            'company_website' => 'nullable|url',
            'products_sold' => 'nullable|string',
            'sells_physical_products' => 'boolean',
            'representative_name' => 'sometimes|string',
            'representative_cpf' => 'sometimes|string',
            'representative_email' => 'sometimes|email',
            'representative_phone' => 'sometimes|string',
            'date_of_birth' => 'sometimes|string',
            'mother_name' => 'sometimes|string',
            'postal_code' => 'sometimes|string',
            'street' => 'sometimes|string',
            'number' => 'sometimes|string',
            'neighborhood' => 'sometimes|string',
            'city' => 'sometimes|string',
            'state' => 'sometimes|string|max:2',
            'complement' => 'nullable|string',
        ]);

        $user = Auth::user();

        try {
            $profile = CompanyProfile::where('user_id', $user->id)->firstOrFail();
            $profile->update($validated);
            return response()->json($profile);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Erro ao atualizar perfil'], 500);
        }
    }
}
