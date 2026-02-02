// ===================================
// AUTENTICAÇÃO
// ===================================

async function fazerLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
        return alert("Preencha email e senha.");
    }

    try {
        const { data, error } = await sb.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        alert("Login realizado com sucesso! ✅");
        window.location.href = "dashboard.html";

    } catch (e) {
        console.error("Erro no login:", e);
        alert("Email ou senha incorretos.");
    }
}

async function fazerRegistro() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (!email || !password || !confirmPassword) {
        return alert("Preencha todos os campos.");
    }

    if (password !== confirmPassword) {
        return alert("As senhas não coincidem.");
    }

    if (password.length < 6) {
        return alert("A senha deve ter pelo menos 6 caracteres.");
    }

    try {
        const { data, error } = await sb.auth.signUp({
            email: email,
            password: password
        });

        if (error) throw error;

        alert("Conta criada com sucesso! ✅ Faça login para continuar.");
        window.location.href = "index.html";

    } catch (e) {
        console.error("Erro no registro:", e);
        alert("Erro ao criar conta. Tente novamente.");
    }
}

async function fazerLogout() {
    try {
        const { error } = await sb.auth.signOut();
        if (error) throw error;

        alert("Logout realizado com sucesso! ✅");
        window.location.href = "index.html";

    } catch (e) {
        console.error("Erro no logout:", e);
        alert("Erro ao fazer logout.");
    }
}

async function verificarAuth() {
    try {
        const { data: { user }, error } = await sb.auth.getUser();
        
        if (error || !user) {
            window.location.href = "index.html";
            return null;
        }

        return user;
    } catch (e) {
        console.error("Erro ao verificar autenticação:", e);
        window.location.href = "index.html";
        return null;
    }
}

// ===================================
// RECUPERAÇÃO DE SENHA
// ===================================

async function recuperarSenha() {
    const email = document.getElementById('email-recuperacao').value;

    if (!email) {
        return alert("Digite seu email para recuperação.");
    }

    try {
        const { error } = await sb.auth.resetPasswordForEmail(email, {
            redirectTo: 'redefinir-senha.html'
        });

        if (error) throw error;

        alert("Email de recuperação enviado! ✅ Verifique sua caixa de entrada.");

    } catch (e) {
        console.error("Erro na recuperação:", e);
        alert("Erro ao enviar email de recuperação. Tente novamente.");
    }
}

async function redefinirSenha() {
    const novaSenha = document.getElementById('nova-senha').value;
    const confirmarSenha = document.getElementById('confirmar-senha').value;

    if (!novaSenha || !confirmarSenha) {
        return alert("Preencha todos os campos.");
    }

    if (novaSenha !== confirmarSenha) {
        return alert("As senhas não coincidem.");
    }

    if (novaSenha.length < 6) {
        return alert("A senha deve ter pelo menos 6 caracteres.");
    }

    try {
        const { error } = await sb.auth.updateUser({
            password: novaSenha
        });

        if (error) throw error;

        alert("Senha redefinida com sucesso! ✅");
        window.location.href = "index.html";

    } catch (e) {
        console.error("Erro ao redefinir senha:", e);
        alert("Erro ao redefinir senha. Tente novamente.");
    }
}

// ===================================
// VERIFICAÇÃO DE SESSÃO
// ===================================

async function verificarSessaoAtiva() {
    try {
        const { data: { session }, error } = await sb.auth.getSession();
        
        if (error || !session) {
            // Se não houver sessão, redireciona para login
            if (window.location.pathname !== '/index.html' && 
                window.location.pathname !== '/redefinir-senha.html') {
                window.location.href = "index.html";
            }
            return false;
        }

        return true;
    } catch (e) {
        console.error("Erro ao verificar sessão:", e);
        return false;
    }
}

// Inicializa verificação de sessão
document.addEventListener('DOMContentLoaded', () => {
    // Verifica sessão em páginas protegidas
    if (!window.location.pathname.includes('index.html') && 
        !window.location.pathname.includes('redefinir-senha.html')) {
        verificarSessaoAtiva();
    }
});
