// ===================================
// ORÇAFÁCIL - SISTEMA MODULAR
// ===================================

// Configuração do Supabase
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqZXF4b2N1dXF1b3NmYXBpYnhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4OTAyMjUsImV4cCI6MjA4MjQ2NjIyNX0.K4nIiH_N22CCVwBWfBkwfJtn65m96QS8iQSAO35iOFU';

// Inicializa cliente Supabase global
window.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Carrega sistema modular quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    // Detecta página atual
    const pagina = window.location.pathname.split('/').pop() || 'dashboard.html';
    
    console.log(`🚀 OrçaFácil - Carregando página: ${pagina}`);
    
    // Inicializa funções baseadas na página atual
    switch (pagina) {
        case 'dashboard.html':
            if (document.getElementById('lista-orcamentos-recentes')) {
                import('./orcamentos.js').then(m => m.carregarOrcamentosRecentes());
            }
            if (document.getElementById('lista-clientes')) {
                import('./clientes.js').then(m => m.carregarListaClientes());
            }
            import('./configuracoes.js').then(m => {
                m.atualizarKPIs();
                m.verificarPreenchimentoCadastro();
            });
            break;
            
        case 'orcamentos.html':
            import('./orcamentos.js').then(m => m.carregarOrcamentosRecentes());
            break;
            
        case 'criar-orcamento.html':
            import('./clientes.js').then(m => m.carregarSelectClientes());
            break;
            
        case 'detalhes.html':
            import('./orcamentos.js').then(m => m.carregarDetalhes());
            break;
            
        case 'ajustes.html':
            import('./configuracoes.js').then(m => m.carregarConfiguracoesSupabase());
            break;
            
        case 'clientes.html':
            import('./clientes.js').then(m => m.carregarListaClientes());
            break;
            
        case 'index.html':
            // Página de login - auth.js é carregado via HTML
            break;
            
        case 'redefinir-senha.html':
            // Página de recuperação - auth.js é carregado via HTML
            break;
    }
});

// Exporta utilitários globais
window.utilitarios = {
    formatarData: (dataString) => {
        if (!dataString) return '-';
        const data = new Date(dataString);
        return data.toLocaleDateString('pt-PT');
    },
    
    formatarDinheiro: (valor) => {
        if (!valor) return '0,00';
        return valor.toFixed(2).replace('.', ',');
    },
    
    getStatusClass: (status) => {
        switch (status) {
            case 'Aprovado': return 'bg-green-100 text-green-800';
            case 'Rejeitado': return 'bg-red-100 text-red-800';
            case 'Pendente': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    },
    
    isLightColor: (hexColor) => {
        if (!hexColor) return true;
        const color = hexColor.replace('#', '');
        const r = parseInt(color.substr(0, 2), 16);
        const g = parseInt(color.substr(2, 2), 16);
        const b = parseInt(color.substr(4, 2), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.5;
    }
};

console.log('✅ OrçaFácil - Sistema inicializado com sucesso!');
