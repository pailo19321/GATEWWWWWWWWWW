@extends('layouts.app')

@section('title', 'BlackPay - Login e Cadastro')

@section('content')
<div class="min-h-screen bg-gray-50 flex relative" x-data="{
    showPassword: false,
    showConfirmPassword: false,
    isLoginView: {{ request('view') === 'login' ? 'true' : 'false' }},
    showSuccessToast: {{ session('success') ? 'true' : 'false' }}
}">
    <div x-show="showSuccessToast"
         x-transition:enter="animate-slide-in"
         class="fixed top-6 right-6 bg-white rounded-xl shadow-2xl p-4 flex items-start gap-3 max-w-md z-50 border border-green-100">
        <div class="flex-shrink-0">
            <svg class="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
        </div>
        <div class="flex-1">
            <h3 class="text-sm font-semibold text-gray-900 mb-1">
                Conta criada com sucesso!
            </h3>
            <p class="text-sm text-gray-600">
                Por favor, verifique seu e-mail para confirmar seu cadastro.
            </p>
        </div>
        <button @click="showSuccessToast = false" class="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
        </button>
    </div>

    <div class="hidden lg:flex lg:w-1/2 items-center justify-center p-16">
        <div class="text-center">
            <div class="inline-flex items-center gap-3">
                <img src="{{ asset('logo-g.svg') }}" alt="BlackPay Logo" class="w-14 h-14 rounded-xl object-cover">
                <span class="text-4xl font-bold text-gray-900">BlackPay</span>
            </div>
        </div>
    </div>

    <div class="w-full lg:w-1/2 bg-white flex items-center justify-start lg:justify-center p-6 lg:p-16">
        <div class="w-full max-w-lg">
            <div class="flex items-center gap-2.5 mb-8 lg:hidden">
                <img src="{{ asset('logo-g.svg') }}" alt="BlackPay Logo" class="w-8 h-8 rounded-lg object-cover">
                <span class="text-xl font-bold text-gray-900">BlackPay</span>
            </div>

            <div x-show="!isLoginView">
                <div class="space-y-6 lg:space-y-8">
                    <div>
                        <h1 class="text-xl lg:text-2xl font-semibold text-gray-900 mb-1.5 lg:mb-2">
                            Crie sua conta
                        </h1>
                        <p class="text-gray-600 text-sm lg:text-base leading-relaxed">
                            Preencha os dados para criar sua conta.
                        </p>
                    </div>

                    <form action="{{ route('register') }}" method="POST" class="space-y-4 lg:space-y-5">
                        @csrf
                        <div>
                            <label for="email" class="block text-xs lg:text-sm font-medium text-gray-900 mb-1.5 lg:mb-2">
                                E-mail
                            </label>
                            <input type="email" id="email" name="email" value="{{ old('email') }}" placeholder="meuemail@exemplo.com" class="w-full px-3.5 lg:px-4 py-3 lg:py-3.5 rounded-lg lg:rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all text-sm lg:text-base text-gray-900 placeholder:text-gray-400">
                            @error('email')
                                <p class="mt-1.5 lg:mt-2 text-xs lg:text-sm text-red-500">{{ $message }}</p>
                            @enderror
                        </div>

                        <div>
                            <label for="password" class="block text-xs lg:text-sm font-medium text-gray-900 mb-1.5 lg:mb-2">
                                Senha
                            </label>
                            <div class="relative">
                                <input :type="showPassword ? 'text' : 'password'" id="password" name="password" placeholder="Digite sua senha" class="w-full px-3.5 lg:px-4 py-3 lg:py-3.5 pr-11 lg:pr-12 rounded-lg lg:rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-sm lg:text-base text-gray-900 placeholder:text-gray-400">
                                <button type="button" @click="showPassword = !showPassword" class="absolute right-3.5 lg:right-4 top-1/2 -translate-y-1/2 text-gray-900 hover:text-gray-700 transition-colors">
                                    <svg x-show="!showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                    </svg>
                                    <svg x-show="showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="display: none;">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
                                    </svg>
                                </button>
                            </div>
                            @error('password')
                                <p class="mt-1.5 lg:mt-2 text-xs lg:text-sm text-red-500">{{ $message }}</p>
                            @else
                                <p class="mt-1.5 lg:mt-2 text-xs lg:text-sm text-gray-500">Senha muito fraca</p>
                            @enderror
                        </div>

                        <div>
                            <label for="password_confirmation" class="block text-xs lg:text-sm font-medium text-gray-900 mb-1.5 lg:mb-2">
                                Confirme sua senha
                            </label>
                            <div class="relative">
                                <input :type="showConfirmPassword ? 'text' : 'password'" id="password_confirmation" name="password_confirmation" placeholder="Digite sua senha novamente" class="w-full px-3.5 lg:px-4 py-3 lg:py-3.5 pr-11 lg:pr-12 rounded-lg lg:rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-sm lg:text-base text-gray-900 placeholder:text-gray-400">
                                <button type="button" @click="showConfirmPassword = !showConfirmPassword" class="absolute right-3.5 lg:right-4 top-1/2 -translate-y-1/2 text-gray-900 hover:text-gray-700 transition-colors">
                                    <svg x-show="!showConfirmPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                    </svg>
                                    <svg x-show="showConfirmPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="display: none;">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
                                    </svg>
                                </button>
                            </div>
                            @error('password_confirmation')
                                <p class="mt-1.5 lg:mt-2 text-xs lg:text-sm text-red-500">{{ $message }}</p>
                            @enderror
                        </div>

                        <button type="submit" class="w-full py-3.5 lg:py-4 bg-gradient-to-r from-gray-900 via-black to-gray-900 hover:from-black hover:via-gray-800 hover:to-black text-white font-semibold rounded-lg lg:rounded-xl shadow-md hover:shadow-lg transition-all duration-200 mt-6 lg:mt-8 text-sm lg:text-base">
                            Criar Conta
                        </button>

                        <p class="text-center text-xs lg:text-sm text-gray-600 pt-1 lg:pt-2">
                            Já possui conta?
                            <button type="button" @click="isLoginView = true" class="text-gray-900 hover:text-gray-700 font-semibold transition-colors">
                                Entrar
                            </button>
                        </p>
                    </form>
                </div>
            </div>

            <div x-show="isLoginView" style="display: none;">
                <div class="space-y-6 lg:space-y-8">
                    <div>
                        <h1 class="text-xl lg:text-2xl font-semibold text-gray-900 mb-1.5 lg:mb-2">
                            Bem-vindo de volta!
                        </h1>
                        <p class="text-gray-600 text-sm lg:text-base leading-relaxed">
                            Entre com seus dados para acessar sua conta.
                        </p>
                    </div>

                    <form action="{{ route('login') }}" method="POST" class="space-y-4 lg:space-y-5">
                        @csrf
                        <div>
                            <label for="loginEmail" class="block text-xs lg:text-sm font-medium text-gray-900 mb-1.5 lg:mb-2">
                                E-mail
                            </label>
                            <input type="email" id="loginEmail" name="email" value="{{ old('email') }}" placeholder="meuemail@exemplo.com" class="w-full px-3.5 lg:px-4 py-3 lg:py-3.5 rounded-lg lg:rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all text-sm lg:text-base text-gray-900 placeholder:text-gray-400">
                            @error('email')
                                <p class="mt-1.5 lg:mt-2 text-xs lg:text-sm text-red-500">{{ $message }}</p>
                            @enderror
                        </div>

                        <div>
                            <label for="loginPassword" class="block text-xs lg:text-sm font-medium text-gray-900 mb-1.5 lg:mb-2">
                                Senha
                            </label>
                            <div class="relative">
                                <input :type="showPassword ? 'text' : 'password'" id="loginPassword" name="password" placeholder="Digite sua senha" class="w-full px-3.5 lg:px-4 py-3 lg:py-3.5 pr-11 lg:pr-12 rounded-lg lg:rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-sm lg:text-base text-gray-900 placeholder:text-gray-400">
                                <button type="button" @click="showPassword = !showPassword" class="absolute right-3.5 lg:right-4 top-1/2 -translate-y-1/2 text-gray-900 hover:text-gray-700 transition-colors">
                                    <svg x-show="!showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                    </svg>
                                    <svg x-show="showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="display: none;">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
                                    </svg>
                                </button>
                            </div>
                            @error('password')
                                <p class="mt-1.5 lg:mt-2 text-xs lg:text-sm text-red-500">{{ $message }}</p>
                            @enderror
                        </div>

                        <div class="text-left">
                            <a href="{{ route('password.request') }}" class="text-xs lg:text-sm text-gray-900 hover:text-gray-700 font-semibold transition-colors">
                                Esqueci a senha
                            </a>
                        </div>

                        <button type="submit" class="w-full py-3.5 lg:py-4 bg-gradient-to-r from-gray-900 via-black to-gray-900 hover:from-black hover:via-gray-800 hover:to-black text-white font-semibold rounded-lg lg:rounded-xl shadow-md hover:shadow-lg transition-all duration-200 mt-6 lg:mt-8 text-sm lg:text-base">
                            Entrar
                        </button>

                        <p class="text-center text-xs lg:text-sm text-gray-600 pt-1 lg:pt-2">
                            Novo por aqui?
                            <button type="button" @click="isLoginView = false" class="text-gray-900 hover:text-gray-700 font-semibold transition-colors">
                                Criar uma conta
                            </button>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>

<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
@endsection
