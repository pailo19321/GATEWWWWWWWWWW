<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Wallet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => $validator->errors()->first()
            ], 422);
        }

        try {
            $user = User::create([
                'email' => $request->email,
                'password' => Hash::make($request->password),
            ]);

            Wallet::create([
                'user_id' => $user->id,
                'balance' => 0,
                'available_balance' => 0,
                'pending_balance' => 0,
            ]);

            Auth::login($user);

            return response()->json([
                'user' => [
                    'id' => $user->id,
                    'email' => $user->email,
                ],
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Erro ao criar conta'
            ], 500);
        }
    }

    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => $validator->errors()->first()
            ], 422);
        }

        if (Auth::attempt($request->only('email', 'password'))) {
            $request->session()->regenerate();
            $user = Auth::user();

            return response()->json([
                'user' => [
                    'id' => $user->id,
                    'email' => $user->email,
                ],
            ]);
        }

        return response()->json([
            'error' => 'Email ou senha incorretos'
        ], 401);
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Logged out successfully']);
    }

    public function user(Request $request)
    {
        if (!Auth::check()) {
            return response()->json(['user' => null]);
        }

        $user = Auth::user();
        return response()->json([
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
            ],
        ]);
    }
}
