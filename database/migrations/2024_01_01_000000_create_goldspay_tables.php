<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Users table (built-in Laravel)
        Schema::create('users', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('email')->unique();
            $table->string('password');
            $table->rememberToken();
            $table->timestamps();
        });

        // Admin Roles
        Schema::create('admin_roles', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('user_id')->unique();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->enum('role', ['super_admin', 'admin', 'support', 'financial'])->default('admin');
            $table->json('permissions')->default('[]');
            $table->boolean('is_active')->default(true);
            $table->uuid('created_by')->nullable();
            $table->timestamps();
        });

        // Company Profiles
        Schema::create('company_profiles', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('user_id')->unique();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->enum('business_type', ['juridica', 'fisica']);
            $table->string('document_number');
            $table->string('business_name');
            $table->string('invoice_name');
            $table->decimal('average_revenue', 15, 2)->default(0);
            $table->decimal('average_ticket', 15, 2)->default(0);
            $table->string('company_website')->nullable();
            $table->text('products_sold')->nullable();
            $table->boolean('sells_physical_products')->default(false);
            $table->string('representative_name');
            $table->string('representative_cpf');
            $table->string('representative_email');
            $table->string('representative_phone');
            $table->string('date_of_birth');
            $table->string('mother_name');
            $table->string('postal_code');
            $table->string('street');
            $table->string('number');
            $table->string('neighborhood');
            $table->string('city');
            $table->string('state', 2);
            $table->string('complement')->nullable();
            $table->string('document_frontal_url')->nullable();
            $table->string('document_back_url')->nullable();
            $table->string('document_selfie_url')->nullable();
            $table->string('document_contract_url')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected', 'under_review'])->default('pending');
            $table->text('rejection_reason')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->uuid('approved_by')->nullable();
            $table->foreign('approved_by')->references('id')->on('users');
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
        });

        // Wallets
        Schema::create('wallets', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('user_id')->unique();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->decimal('balance', 15, 2)->default(0);
            $table->decimal('available_balance', 15, 2)->default(0);
            $table->decimal('pending_balance', 15, 2)->default(0);
            $table->string('currency', 3)->default('BRL');
            $table->timestamps();
        });

        // Transactions
        Schema::create('transactions', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('user_id');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->uuid('customer_id')->nullable();
            $table->foreign('customer_id')->references('id')->on('users');
            $table->decimal('amount', 15, 2);
            $table->decimal('net_amount', 15, 2)->nullable();
            $table->decimal('fee_amount', 15, 2)->default(0);
            $table->decimal('fee_percentage', 5, 2)->default(0);
            $table->enum('status', ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'])->default('pending');
            $table->enum('type', ['payment', 'refund', 'payout', 'fee', 'chargeback']);
            $table->string('payment_method')->nullable();
            $table->string('external_id')->nullable();
            $table->string('gateway')->nullable();
            $table->json('gateway_response')->nullable();
            $table->text('description')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
        });

        // Customers
        Schema::create('customers', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('user_id');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->string('name');
            $table->string('email');
            $table->string('document')->nullable();
            $table->string('phone')->nullable();
            $table->json('address')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
        });

        // API Keys
        Schema::create('api_keys', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('user_id');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->string('name');
            $table->string('key')->unique();
            $table->enum('type', ['production', 'test'])->default('test');
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_used_at')->nullable();
            $table->timestamps();
        });

        // Webhooks
        Schema::create('webhooks', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('user_id');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->string('url');
            $table->json('events')->default('[]');
            $table->string('secret')->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('retry_count')->default(0);
            $table->timestamp('last_triggered_at')->nullable();
            $table->timestamps();
        });

        // Platform Settings
        Schema::create('platform_settings', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('key')->unique();
            $table->json('value');
            $table->text('description')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->foreign('updated_by')->references('id')->on('users');
            $table->timestamps();
        });

        // Activity Logs
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('user_id')->nullable();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            $table->string('action');
            $table->string('entity_type')->nullable();
            $table->uuid('entity_id')->nullable();
            $table->json('changes')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
        Schema::dropIfExists('platform_settings');
        Schema::dropIfExists('webhooks');
        Schema::dropIfExists('api_keys');
        Schema::dropIfExists('customers');
        Schema::dropIfExists('transactions');
        Schema::dropIfExists('wallets');
        Schema::dropIfExists('company_profiles');
        Schema::dropIfExists('admin_roles');
        Schema::dropIfExists('users');
    }
};
