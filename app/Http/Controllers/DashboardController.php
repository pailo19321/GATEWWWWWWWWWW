<?php

namespace App\Http\Controllers;

use App\Services\SupabaseService;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    protected $supabase;

    public function __construct(SupabaseService $supabase)
    {
        $this->supabase = $supabase;
    }

    public function index(Request $request)
    {
        $user = $request->user();

        $stats = [
            'total_revenue' => 0,
            'total_transactions' => 0,
            'pending_amount' => 0,
            'available_balance' => 0,
        ];

        try {
            $transactions = $this->supabase->getTransactions($user->id);
            $wallet = $this->supabase->getWallet($user->id);

            $stats['total_revenue'] = array_sum(array_column($transactions, 'amount'));
            $stats['total_transactions'] = count($transactions);
            $stats['available_balance'] = $wallet['available_balance'] ?? 0;
            $stats['pending_amount'] = $wallet['pending_balance'] ?? 0;
        } catch (\Exception $e) {
            \Log::error('Dashboard stats error: ' . $e->getMessage());
        }

        return view('dashboard', compact('stats', 'user'));
    }

    public function transactions(Request $request)
    {
        $user = $request->user();

        try {
            $transactions = $this->supabase->getTransactions($user->id);
            return response()->json($transactions);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function wallet(Request $request)
    {
        $user = $request->user();

        try {
            $wallet = $this->supabase->getWallet($user->id);
            return response()->json($wallet);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
