// ===================================
// CONFIGURAÇÕES DA EMPRESA
// ===================================

async function carregarConfiguracoesSupabase() {
    try {
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return;

        const { data: empresa, error } = await sb
            .from('empresas')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (empresa) {
            // Preenche formulário de configurações
            document.getElementById('empresa-nome-config').value = empresa.nome || '';
            document.getElementById('empresa-endereco').value = empresa.endereco || '';
            document.getElementById('empresa-nif').value = empresa.nif || '';
            document.getElementById('empresa-telefone').value = empresa.telefone || '';
            document.getElementById('empresa-chave-pix').value = empresa.chave_pix || '';
            document.getElementById('cor-primaria').value = empresa.cor_primaria || '#3B82F6';
            document.getElementById('cor-texto').value = empresa.cor_texto || '#FFFFFF';

            // Logo
            if (empresa.logo_url) {
                document.getElementById('logo-preview').src = empresa.logo_url;
                document.getElementById('logo-preview').classList.remove('hidden');
            }

            // Aplica cores no preview
            aplicarCoresPreview(empresa.cor_primaria, empresa.cor_texto);
        }

        // Verifica se formulário está completo
        verificarPreenchimentoCadastro();

    } catch (e) {
        console.error("Erro ao carregar configurações:", e);
    }
}

async function salvarConfiguracoes() {
    try {
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return alert("Sessão expirada. Faça login novamente.");

        const config = {
            user_id: user.id,
            nome: document.getElementById('empresa-nome-config').value,
            endereco: document.getElementById('empresa-endereco').value,
            nif: document.getElementById('empresa-nif').value,
            telefone: document.getElementById('empresa-telefone').value,
            chave_pix: document.getElementById('empresa-chave-pix').value,
            cor_primaria: document.getElementById('cor-primaria').value,
            cor_texto: document.getElementById('cor-texto').value,
            updated_at: new Date().toISOString()
        };

        // Verifica se já existe configuração
        const { data: existente } = await sb
            .from('empresas')
            .select('id')
            .eq('user_id', user.id)
            .single();

        let result;
        if (existente) {
            // Atualiza
            result = await sb.from('empresas').update(config).eq('id', existente.id);
        } else {
            // Insere
            config.created_at = new Date().toISOString();
            result = await sb.from('empresas').insert([config]);
        }

        if (result.error) throw result.error;

        alert("Configurações salvas com sucesso! ✅");
        await carregarConfiguracoesSupabase();

    } catch (e) {
        console.error("Erro ao salvar configurações:", e);
        alert("Erro ao salvar configurações. Tente novamente.");
    }
}

async function fazerUploadLogo(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
        alert("A imagem deve ter menos de 2MB.");
        return;
    }

    try {
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return alert("Sessão expirada. Faça login novamente.");

        // Upload para Supabase Storage
        const fileName = `logo-${user.id}-${Date.now()}.${file.name.split('.').pop()}`;
        const { error: uploadError } = await sb.storage
            .from('logos')
            .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Pega URL pública
        const { data: { publicUrl } } = sb.storage
            .from('logos')
            .getPublicUrl(fileName);

        // Atualiza empresa com URL do logo
        const { error: updateError } = await sb
            .from('empresas')
            .update({ logo_url: publicUrl })
            .eq('user_id', user.id);

        if (updateError) throw updateError;

        // Atualiza preview
        document.getElementById('logo-preview').src = publicUrl;
        document.getElementById('logo-preview').classList.remove('hidden');

        alert("Logo atualizado com sucesso! ✅");

    } catch (e) {
        console.error("Erro ao fazer upload:", e);
        alert("Erro ao fazer upload do logo. Tente novamente.");
    }
}

function aplicarCoresPreview(corPrimaria, corTexto) {
    const preview = document.getElementById('preview-orcamento');
    if (!preview) return;

    preview.style.borderColor = corPrimaria;
    preview.style.backgroundColor = corPrimaria;
    preview.style.color = corTexto || (isLightColor(corPrimaria) ? '#000000' : '#ffffff');
}

function verificarPreenchimentoCadastro() {
    const campos = [
        'empresa-nome-config',
        'empresa-endereco',
        'empresa-nif',
        'empresa-telefone'
    ];

    const preenchido = campos.every(id => {
        const campo = document.getElementById(id);
        return campo && campo.value.trim() !== '';
    });

    const alerta = document.getElementById('alerta-cadastro-incompleto');
    if (alerta) {
        alerta.classList.toggle('hidden', preenchido);
    }

    return preenchido;
}

// ===================================
// CORES DO PDF
// ===================================

function aplicarCoresPDF(corPrimaria, corTexto = null) {
    if (!corPrimaria || corPrimaria === '#000000') return; // Ignora se for preto ou vazio

    // Apenas o cabeçalho da tabela recebe a cor
    // Também a linha (borda) abaixo do header
    const headerBar = document.getElementById('pdf-header-bar');
    if (headerBar) {
        headerBar.style.borderColor = corPrimaria;
    }

    // Table header row (cabeçalho da tabela)
    const tableHeader = document.getElementById('pdf-table-header');
    if (tableHeader) {
        // Remove cor do TR para evitar conflito
        tableHeader.style.backgroundColor = 'transparent';

        const ths = tableHeader.querySelectorAll('th');
        ths.forEach(th => {
            th.style.backgroundColor = corPrimaria;
            // Usa cor customizada se existir, senão calcula contraste
            th.style.color = corTexto || (isLightColor(corPrimaria) ? '#000000' : '#ffffff');
        });
    }

    // Linha acima dos Termos
    const termsBorder = document.getElementById('pdf-terms-border');
    if (termsBorder) {
        termsBorder.style.borderColor = corPrimaria;
    }
}

function isLightColor(hexColor) {
    if (!hexColor) return true;
    
    // Remove o # se existir
    const color = hexColor.replace('#', '');
    
    // Converte para RGB
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);
    
    // Calcula luminância
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5;
}

// ===================================
// KPIs E DASHBOARD
// ===================================

async function atualizarKPIs() {
    try {
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return;

        // Orçamentos do mês
        const inicioMes = new Date();
        inicioMes.setDate(1);
        inicioMes.setHours(0, 0, 0, 0);

        const { data: orcamentosMes, error: errorMes } = await sb
            .from('orcamentos')
            .select('valor, status')
            .eq('user_id', user.id)
            .gte('created_at', inicioMes.toISOString());

        if (errorMes) throw errorMes;

        // Total do mês
        const totalMes = orcamentosMes?.reduce((sum, orc) => sum + (orc.valor || 0), 0) || 0;
        const kpiMes = document.getElementById('kpi-mes');
        if (kpiMes) kpiMes.textContent = `€${formatarDinheiro(totalMes)}`;

        // Orçamentos aprovados
        const aprovados = orcamentosMes?.filter(orc => orc.status === 'Aprovado').length || 0;
        const kpiAprovados = document.getElementById('kpi-aprovados');
        if (kpiAprovados) kpiAprovados.textContent = aprovados;

        // Total de orçamentos
        const kpiTotal = document.getElementById('kpi-total');
        if (kpiTotal) kpiTotal.textContent = orcamentosMes?.length || 0;

    } catch (e) {
        console.error("Erro ao atualizar KPIs:", e);
    }
}
