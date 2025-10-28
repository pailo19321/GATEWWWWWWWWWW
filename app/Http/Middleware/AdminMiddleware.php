<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Services\SupabaseService;

class AdminMiddleware
{
    protected $supabase;

    public function __construct(SupabaseService $supabase)
    {
        $this->supabase = $supabase;
    }

    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        try {
            $adminRole = $this->supabase->getUserAdminRole($user->id);

            if (!$adminRole || !$adminRole['is_active']) {
                return response()->json(['error' => 'Forbidden - Admin access required'], 403);
            }

            $request->attributes->set('admin_role', $adminRole);

            return $next($request);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Forbidden'], 403);
        }
    }
}
