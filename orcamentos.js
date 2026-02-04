// ===================================
// ORÇAMENTOS
// ===================================

async function carregarOrcamentosRecentes() {
    try {
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return;

        const { data, error } = await sb
            .from('orcamentos')
            .select(`
                *,
                clientes (nome)
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) throw error;
        const lista = document.getElementById('lista-orcamentos-recentes');
        if (!lista) return;

        lista.innerHTML = '';
        if (!data || data.length === 0) {
            lista.innerHTML = '<p class="text-gray-400 text-sm">Nenhum orçamento encontrado.</p>';
            return;
        }

        data.forEach(orc => {
            const item = document.createElement('div');
            item.className = 'p-3 border rounded-lg hover:bg-gray-50 cursor-pointer';
            item.innerHTML = `
                <div class="font-bold text-sm">#${orc.id} - ${orc.clientes?.nome || 'Cliente'}</div>
                <div class="text-xs text-gray-500">${formatarData(orc.created_at)} • €${formatarDinheiro(orc.valor)}</div>
                <div class="text-xs mt-1">
                    <span class="px-2 py-1 rounded text-xs ${getStatusClass(orc.status)}">${orc.status}</span>
                </div>
            `;
            item.onclick = () => window.location.href = `detalhes.html?id=${orc.id}`;
            lista.appendChild(item);
        });
    } catch (e) {
        console.error("Erro ao carregar orçamentos recentes:", e);
    }
}

async function carregarDetalhes() {
    const id = new URLSearchParams(window.location.search).get('id');
    if (!id) { alert("ID do orçamento não encontrado."); return; }

    try {
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return alert("Sessão expirada. Faça login novamente.");

        // Carrega orçamento
        const { data: orcamento, error: errorOrc } = await sb
            .from('orcamentos')
            .select('*')
            .eq('id', id)
            .eq('user_id', user.id)
            .single();

        if (errorOrc) throw errorOrc;
        if (!orcamento) return alert("Orçamento não encontrado.");

        // Carrega cliente
        const { data: cliente, error: errorCli } = await sb
            .from('clientes')
            .select('*')
            .eq('id', orcamento.cliente_id)
            .single();

        if (errorCli) throw errorCli;

        // Carrega empresa
        const { data: empresa, error: errorEmp } = await sb
            .from('empresas')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (errorEmp && errorEmp.code !== 'PGRST116') throw errorEmp;

        // Preenche dados do orçamento
        document.getElementById('orc-id').textContent = `#${orcamento.id}`;
        document.getElementById('orc-data').textContent = formatarData(orcamento.created_at);
        document.getElementById('orc-validade').textContent = `${orcamento.validade || 15} dias`;
        document.getElementById('orc-status').textContent = orcamento.status || 'Pendente';
        document.getElementById('orc-valor').textContent = `€${formatarDinheiro(orcamento.valor)}`;
        document.getElementById('orc-subtotal').textContent = `€${formatarDinheiro(orcamento.subtotal || orcamento.valor)}`;
        document.getElementById('orc-desconto').textContent = `-€${formatarDinheiro(orcamento.desconto || 0)}`;

        // Preenche dados do cliente
        if (cliente) {
            document.getElementById('cli-nome').textContent = cliente.nome;
            document.getElementById('cli-email').textContent = cliente.email || '-';
            document.getElementById('cli-tel').textContent = cliente.phone || '-';
            document.getElementById('cli-cpf').textContent = cliente.cpf || '-';
            document.getElementById('cli-sub-empresa').textContent = cliente.empresa || '-';
            document.getElementById('cli-endereco').textContent = cliente.endereco || '-';
        }

        // Preenche dados da empresa
        if (empresa) {
            document.getElementById('empresa-nome').textContent = empresa.nome;
            document.getElementById('empresa-end').textContent = empresa.endereco || 'Endereço não informado';
            document.getElementById('empresa-doc').textContent = `NIF: ${empresa.nif || 'Não informado'}`;
            document.getElementById('empresa-tel').textContent = `Tel: ${empresa.telefone || 'Não informado'}`;

            // Logo da empresa
            if (empresa.logo_url) {
                const logoImg = document.getElementById('empresa-logo-img');
                logoImg.src = empresa.logo_url;
                logoImg.classList.remove('hidden');
            }

            // Aplicar Cores da Empresa no PDF (usa inline styles para compatibilidade)
            if (empresa.cor_primaria) {
                aplicarCoresPDF(empresa.cor_primaria, empresa.cor_texto);
            }
        }

        // Carrega itens do orçamento
        await carregarItensOrcamento(id);

        // Observações
        if (orcamento.observacoes) {
            document.getElementById('obs-pagamento').classList.remove('hidden');
        }
        if (orcamento.prazo_entrega) {
            document.getElementById('obs-prazo').classList.remove('hidden');
            document.getElementById('obs-prazo-dias').textContent = orcamento.prazo_entrega;
        }

    } catch (e) {
        console.error("Erro ao carregar detalhes:", e);
        alert("Erro ao carregar orçamento. Tente novamente.");
    }
}

async function carregarItensOrcamento(orcamentoId) {
    try {
        const { data, error } = await sb
            .from('itens_orcamento')
            .select('*')
            .eq('orcamento_id', orcamentoId)
            .order('created_at');

        if (error) throw error;
        const tbody = document.getElementById('tbody-itens');
        if (!tbody) return;

        tbody.innerHTML = '';
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="2" class="text-center text-gray-400 py-4">Nenhum item encontrado.</td></tr>';
            return;
        }

        data.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="py-2 text-xs">
                    <div class="font-medium">${item.descricao}</div>
                    ${item.quantidade > 1 ? `<div class="text-gray-500">Qtd: ${item.quantidade}</div>` : ''}
                </td>
                <td class="py-2 text-xs text-right font-mono">€${formatarDinheiro(item.valor_total)}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error("Erro ao carregar itens:", e);
    }
}

// ===================================
// CRIAÇÃO DE ORÇAMENTO
// ===================================

async function salvarOrcamento() {
    try {
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return alert("Sessão expirada. Faça login novamente.");

        const clienteId = document.getElementById('select-cliente').value;
        if (!clienteId) return alert("Selecione um cliente.");

        // Coleta itens do orçamento
        const itens = [];
        const rows = document.querySelectorAll('#itens-orcamento tr');

        rows.forEach(row => {
            const desc = row.querySelector('.item-descricao')?.value;
            const valor = row.querySelector('.item-valor')?.value;
            const qtd = row.querySelector('.item-quantidade')?.value || 1;

            if (desc && valor) {
                itens.push({
                    descricao: desc,
                    valor_unitario: parseFloat(valor),
                    quantidade: parseInt(qtd),
                    valor_total: parseFloat(valor) * parseInt(qtd)
                });
            }
        });

        if (itens.length === 0) return alert("Adicione pelo menos um item.");

        // Calcula totais
        const subtotal = itens.reduce((sum, item) => sum + item.valor_total, 0);
        const desconto = parseFloat(document.getElementById('desconto-valor')?.value || 0);
        const total = subtotal - desconto;

        // Dados do orçamento
        const orcamento = {
            user_id: user.id,
            cliente_id: clienteId,
            valor: total,
            subtotal: subtotal,
            desconto: desconto,
            status: 'Pendente',
            validade: 15,
            observacoes: document.getElementById('observacoes')?.value || '',
            prazo_entrega: document.getElementById('prazo-entrega')?.value || null,
            created_at: new Date().toISOString()
        };

        // Salva orçamento
        const { data: orcData, error: orcError } = await sb.from('orcamentos').insert([orcamento]).select();

        if (orcError) throw orcError;
        if (!orcData || orcData.length === 0) throw new Error("Erro ao salvar orçamento.");

        // Salva itens
        const itensComId = itens.map(item => ({
            ...item,
            orcamento_id: orcData[0].id,
            user_id: user.id,
            created_at: new Date().toISOString()
        }));

        const { error: itensError } = await sb.from('itens_orcamento').insert(itensComId);
        if (itensError) throw itensError;

        alert("Orçamento salvo com sucesso! ✅");
        window.location.href = `detalhes.html?id=${orcData[0].id}`;

    } catch (e) {
        console.error("Erro ao salvar orçamento:", e);
        alert("Erro ao guardar orçamento. Tente novamente.");
    }
}

function adicionarItem() {
    const container = document.getElementById('itens-orcamento');
    if (!container) return;

    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td class="p-2">
            <input type="text" class="item-descricao w-full border rounded p-1 text-sm" placeholder="Descrição do item">
        </td>
        <td class="p-2 w-24">
            <input type="number" class="item-quantidade w-full border rounded p-1 text-sm" value="1" min="1">
        </td>
        <td class="p-2 w-32">
            <input type="number" class="item-valor w-full border rounded p-1 text-sm" placeholder="0.00" step="0.01">
        </td>
        <td class="p-2 w-20">
            <button type="button" onclick="this.closest('tr').remove()" class="text-red-500 hover:text-red-700">
                <i class="ph-bold ph-trash"></i>
            </button>
        </td>
    `;
    container.appendChild(tr);
}

// ===================================
// UTILITÁRIOS
// ===================================

function formatarData(dataString) {
    if (!dataString) return '-';
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-PT');
}

function formatarDinheiro(valor) {
    if (!valor) return '0,00';
    return valor.toFixed(2).replace('.', ',');
}

function getStatusClass(status) {
    switch (status) {
        case 'Aprovado': return 'bg-green-100 text-green-800';
        case 'Rejeitado': return 'bg-red-100 text-red-800';
        case 'Pendente': return 'bg-yellow-100 text-yellow-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}
