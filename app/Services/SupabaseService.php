<?php

namespace App\Services;

use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;

class SupabaseService
{
    protected $client;
    protected $supabaseUrl;
    protected $supabaseKey;

    public function __construct()
    {
        $this->supabaseUrl = env('SUPABASE_URL');
        $this->supabaseKey = env('SUPABASE_KEY');

        $this->client = new Client([
            'base_uri' => $this->supabaseUrl,
            'headers' => [
                'apikey' => $this->supabaseKey,
                'Authorization' => 'Bearer ' . $this->supabaseKey,
                'Content-Type' => 'application/json',
            ],
        ]);
    }

    public function signUp($email, $password)
    {
        try {
            $response = $this->client->post('/auth/v1/signup', [
                'json' => [
                    'email' => $email,
                    'password' => $password,
                ],
            ]);

            return json_decode($response->getBody()->getContents(), true);
        } catch (\Exception $e) {
            Log::error('Supabase SignUp Error: ' . $e->getMessage());
            throw $e;
        }
    }

    public function signIn($email, $password)
    {
        try {
            $response = $this->client->post('/auth/v1/token?grant_type=password', [
                'json' => [
                    'email' => $email,
                    'password' => $password,
                ],
            ]);

            return json_decode($response->getBody()->getContents(), true);
        } catch (\Exception $e) {
            Log::error('Supabase SignIn Error: ' . $e->getMessage());
            throw $e;
        }
    }

    public function signOut($accessToken)
    {
        try {
            $response = $this->client->post('/auth/v1/logout', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $accessToken,
                ],
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Supabase SignOut Error: ' . $e->getMessage());
            return false;
        }
    }

    public function getCompanyProfile($userId)
    {
        try {
            $response = $this->client->get('/rest/v1/company_profiles', [
                'query' => [
                    'user_id' => 'eq.' . $userId,
                    'select' => '*',
                ],
            ]);

            $data = json_decode($response->getBody()->getContents(), true);
            return !empty($data) ? $data[0] : null;
        } catch (\Exception $e) {
            Log::error('Get Company Profile Error: ' . $e->getMessage());
            throw $e;
        }
    }

    public function createCompanyProfile($data)
    {
        try {
            $response = $this->client->post('/rest/v1/company_profiles', [
                'json' => $data,
            ]);

            return json_decode($response->getBody()->getContents(), true);
        } catch (\Exception $e) {
            Log::error('Create Company Profile Error: ' . $e->getMessage());
            throw $e;
        }
    }

    public function updateCompanyProfile($userId, $data)
    {
        try {
            $response = $this->client->patch('/rest/v1/company_profiles?user_id=eq.' . $userId, [
                'json' => $data,
            ]);

            return json_decode($response->getBody()->getContents(), true);
        } catch (\Exception $e) {
            Log::error('Update Company Profile Error: ' . $e->getMessage());
            throw $e;
        }
    }

    public function getWallet($userId)
    {
        try {
            $response = $this->client->get('/rest/v1/wallets', [
                'query' => [
                    'user_id' => 'eq.' . $userId,
                    'select' => '*',
                ],
            ]);

            $data = json_decode($response->getBody()->getContents(), true);
            return !empty($data) ? $data[0] : null;
        } catch (\Exception $e) {
            Log::error('Get Wallet Error: ' . $e->getMessage());
            throw $e;
        }
    }

    public function getTransactions($userId)
    {
        try {
            $response = $this->client->get('/rest/v1/transactions', [
                'query' => [
                    'user_id' => 'eq.' . $userId,
                    'select' => '*',
                    'order' => 'created_at.desc',
                ],
            ]);

            return json_decode($response->getBody()->getContents(), true);
        } catch (\Exception $e) {
            Log::error('Get Transactions Error: ' . $e->getMessage());
            throw $e;
        }
    }

    public function getUserAdminRole($userId)
    {
        try {
            $response = $this->client->get('/rest/v1/admin_roles', [
                'query' => [
                    'user_id' => 'eq.' . $userId,
                    'select' => '*',
                ],
            ]);

            $data = json_decode($response->getBody()->getContents(), true);
            return !empty($data) ? $data[0] : null;
        } catch (\Exception $e) {
            Log::error('Get Admin Role Error: ' . $e->getMessage());
            return null;
        }
    }

    public function getPendingProfiles()
    {
        try {
            $response = $this->client->get('/rest/v1/company_profiles', [
                'query' => [
                    'status' => 'eq.pending',
                    'select' => '*',
                    'order' => 'created_at.desc',
                ],
            ]);

            return json_decode($response->getBody()->getContents(), true);
        } catch (\Exception $e) {
            Log::error('Get Pending Profiles Error: ' . $e->getMessage());
            throw $e;
        }
    }

    public function approveCompanyProfile($profileId, $adminUserId)
    {
        try {
            $response = $this->client->patch('/rest/v1/company_profiles?id=eq.' . $profileId, [
                'json' => [
                    'status' => 'approved',
                    'approved_by' => $adminUserId,
                    'approved_at' => now()->toIso8601String(),
                    'reviewed_at' => now()->toIso8601String(),
                ],
            ]);

            return json_decode($response->getBody()->getContents(), true);
        } catch (\Exception $e) {
            Log::error('Approve Company Profile Error: ' . $e->getMessage());
            throw $e;
        }
    }

    public function rejectCompanyProfile($profileId, $adminUserId, $reason)
    {
        try {
            $response = $this->client->patch('/rest/v1/company_profiles?id=eq.' . $profileId, [
                'json' => [
                    'status' => 'rejected',
                    'rejection_reason' => $reason,
                    'approved_by' => $adminUserId,
                    'reviewed_at' => now()->toIso8601String(),
                ],
            ]);

            return json_decode($response->getBody()->getContents(), true);
        } catch (\Exception $e) {
            Log::error('Reject Company Profile Error: ' . $e->getMessage());
            throw $e;
        }
    }

    public function getAllTransactions()
    {
        try {
            $response = $this->client->get('/rest/v1/transactions', [
                'query' => [
                    'select' => '*',
                    'order' => 'created_at.desc',
                    'limit' => 1000,
                ],
            ]);

            return json_decode($response->getBody()->getContents(), true);
        } catch (\Exception $e) {
            Log::error('Get All Transactions Error: ' . $e->getMessage());
            throw $e;
        }
    }

    public function getTotalUsers()
    {
        try {
            $response = $this->client->get('/rest/v1/company_profiles', [
                'query' => [
                    'select' => 'count',
                ],
                'headers' => [
                    'Prefer' => 'count=exact',
                ],
            ]);

            $count = $response->getHeader('Content-Range');
            if (!empty($count)) {
                preg_match('/\/(\d+)$/', $count[0], $matches);
                return isset($matches[1]) ? (int)$matches[1] : 0;
            }

            return 0;
        } catch (\Exception $e) {
            Log::error('Get Total Users Error: ' . $e->getMessage());
            return 0;
        }
    }

    public function getTotalRevenue()
    {
        try {
            $response = $this->client->get('/rest/v1/transactions', [
                'query' => [
                    'select' => 'amount',
                    'status' => 'eq.paid',
                ],
            ]);

            $data = json_decode($response->getBody()->getContents(), true);
            return array_sum(array_column($data, 'amount'));
        } catch (\Exception $e) {
            Log::error('Get Total Revenue Error: ' . $e->getMessage());
            return 0;
        }
    }

    public function getTotalTransactions()
    {
        try {
            $response = $this->client->get('/rest/v1/transactions', [
                'query' => [
                    'select' => 'count',
                ],
                'headers' => [
                    'Prefer' => 'count=exact',
                ],
            ]);

            $count = $response->getHeader('Content-Range');
            if (!empty($count)) {
                preg_match('/\/(\d+)$/', $count[0], $matches);
                return isset($matches[1]) ? (int)$matches[1] : 0;
            }

            return 0;
        } catch (\Exception $e) {
            Log::error('Get Total Transactions Error: ' . $e->getMessage());
            return 0;
        }
    }

    public function getPendingProfilesCount()
    {
        try {
            $response = $this->client->get('/rest/v1/company_profiles', [
                'query' => [
                    'select' => 'count',
                    'status' => 'eq.pending',
                ],
                'headers' => [
                    'Prefer' => 'count=exact',
                ],
            ]);

            $count = $response->getHeader('Content-Range');
            if (!empty($count)) {
                preg_match('/\/(\d+)$/', $count[0], $matches);
                return isset($matches[1]) ? (int)$matches[1] : 0;
            }

            return 0;
        } catch (\Exception $e) {
            Log::error('Get Pending Profiles Count Error: ' . $e->getMessage());
            return 0;
        }
    }
}
