<?php

namespace App\Http\Controllers;

use App\Services\SupabaseService;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    protected $supabase;

    public function __construct(SupabaseService $supabase)
    {
        $this->supabase = $supabase;
        $this->middleware('admin');
    }

    public function index()
    {
        return view('admin.index');
    }

    public function pendingProfiles()
    {
        try {
            $profiles = $this->supabase->getPendingProfiles();
            return response()->json($profiles);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function approveProfile(Request $request, $profileId)
    {
        $user = $request->user();

        try {
            $profile = $this->supabase->approveCompanyProfile($profileId, $user->id);
            return response()->json($profile);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function rejectProfile(Request $request, $profileId)
    {
        $validated = $request->validate([
            'rejection_reason' => 'required|string'
        ]);

        $user = $request->user();

        try {
            $profile = $this->supabase->rejectCompanyProfile(
                $profileId,
                $user->id,
                $validated['rejection_reason']
            );
            return response()->json($profile);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function allTransactions()
    {
        try {
            $transactions = $this->supabase->getAllTransactions();
            return response()->json($transactions);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function statistics()
    {
        try {
            $stats = [
                'total_users' => $this->supabase->getTotalUsers(),
                'total_revenue' => $this->supabase->getTotalRevenue(),
                'total_transactions' => $this->supabase->getTotalTransactions(),
                'pending_profiles' => $this->supabase->getPendingProfilesCount(),
            ];
            return response()->json($stats);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
