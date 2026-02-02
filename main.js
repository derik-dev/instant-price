// ===================================
// INICIALIZAÇÃO E CARREGAMENTO DE MÓDULOS
// ===================================

// Configuração do Supabase (global)
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_KEY = 'your-anon-key';
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Detecta página atual e carrega módulos correspondentes
function carregarModulosPorPagina() {
    const pagina = window.location.pathname.split('/').pop() || 'dashboard.html';
    
    // Módulos que são sempre carregados
    const modulosBase = ['auth.js'];
    
    // Módulos específicos por página
    const modulosPorPagina = {
        'dashboard.html': ['configuracoes.js', 'orcamentos.js'],
        'orcamentos.html': ['orcamentos.js'],
        'criar-orcamento.html': ['clientes.js', 'orcamentos.js'],
        'detalhes.html': ['orcamentos.js', 'configuracoes.js'],
        'ajustes.html': ['configuracoes.js'],
        'clientes.html': ['clientes.js'],
        'index.html': ['auth.js'],
        'redefinir-senha.html': ['auth.js']
    };
    
    // Carrega módulos base
    modulosBase.forEach(modulo => {
        if (!document.querySelector(`script[src="${modulo}"]`)) {
            const script = document.createElement('script');
            script.src = modulo;
            document.head.appendChild(script);
        }
    });
    
    // Carrega módulos específicos
    const modulosEspecificos = modulosPorPagina[pagina] || [];
    modulosEspecificos.forEach(modulo => {
        if (!document.querySelector(`script[src="${modulo}"]`)) {
            const script = document.createElement('script');
            script.src = modulo;
            document.head.appendChild(script);
        }
    });
}

// Inicialização quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    carregarModulosPorPagina();
    
    // Inicializa funções específicas da página
    const pagina = window.location.pathname.split('/').pop() || 'dashboard.html';
    
    switch (pagina) {
        case 'dashboard.html':
            if (document.getElementById('lista-orcamentos-recentes')) carregarOrcamentosRecentes();
            if (document.getElementById('lista-clientes')) carregarListaClientes();
            atualizarKPIs();
            verificarPreenchimentoCadastro();
            break;
            
        case 'orcamentos.html':
            carregarOrcamentosRecentes();
            break;
            
        case 'criar-orcamento.html':
            carregarSelectClientes();
            break;
            
        case 'detalhes.html':
            carregarDetalhes();
            break;
            
        case 'ajustes.html':
            carregarConfiguracoesSupabase();
            break;
            
        case 'clientes.html':
            carregarListaClientes();
            break;
    }
});

// ===================================
// UTILITÁRIOS GLOBAIS
// ===================================

// Formatação de data
function formatarData(dataString) {
    if (!dataString) return '-';
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-PT');
}

// Formatação de dinheiro
function formatarDinheiro(valor) {
    if (!valor) return '0,00';
    return valor.toFixed(2).replace('.', ',');
}

// Classe de status
function getStatusClass(status) {
    switch (status) {
        case 'Aprovado': return 'bg-green-100 text-green-800';
        case 'Rejeitado': return 'bg-red-100 text-red-800';
        case 'Pendente': return 'bg-yellow-100 text-yellow-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

// Verificação de cor clara/escura
function isLightColor(hexColor) {
    if (!hexColor) return true;
    
    const color = hexColor.replace('#', '');
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);
    
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5;
}

// Exporta para uso global
window.formatarData = formatarData;
window.formatarDinheiro = formatarDinheiro;
window.getStatusClass = getStatusClass;
window.isLightColor = isLightColor;
