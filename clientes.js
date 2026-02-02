// ===================================
// CLIENTES
// ===================================

async function carregarListaClientes() {
    try {
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return;

        const { data, error } = await sb
            .from('clientes')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        const lista = document.getElementById('lista-clientes');
        if (!lista) return;

        lista.innerHTML = '';
        if (!data || data.length === 0) {
            lista.innerHTML = '<p class="text-gray-400 text-sm">Nenhum cliente registado.</p>';
            return;
        }

        data.forEach(cliente => {
            const item = document.createElement('div');
            item.className = 'p-3 border rounded-lg hover:bg-gray-50 cursor-pointer';
            item.innerHTML = `
                <div class="font-bold text-sm">${cliente.nome}</div>
                <div class="text-xs text-gray-500">${cliente.email || 'Sem email'} • ${cliente.phone || 'Sem telefone'}</div>
            `;
            item.onclick = () => {
                document.getElementById('select-cliente').value = cliente.id;
                carregarDetalhesCliente(cliente.id);
            };
            lista.appendChild(item);
        });
    } catch (e) {
        console.error("Erro ao carregar lista clientes:", e);
    }
}

async function carregarSelectClientes() {
    try {
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return;

        const { data, error } = await sb
            .from('clientes')
            .select('id, nome')
            .eq('user_id', user.id)
            .order('nome');

        if (error) throw error;
        const select = document.getElementById('select-cliente');
        if (!select) return;

        select.innerHTML = '<option value="">Selecione um cliente...</option>';
        data.forEach(cliente => {
            const option = document.createElement('option');
            option.value = cliente.id;
            option.textContent = cliente.nome;
            select.appendChild(option);
        });
    } catch (e) {
        console.error("Erro ao carregar select clientes:", e);
    }
}

async function carregarDetalhesCliente(clienteId) {
    try {
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return;

        const { data, error } = await sb
            .from('clientes')
            .select('*')
            .eq('id', clienteId)
            .eq('user_id', user.id)
            .single();

        if (error) throw error;
        if (!data) return;

        // Preenche campos do formulário
        document.getElementById('novo-cli-nome').value = data.nome || '';
        document.getElementById('novo-cli-phone').value = data.phone || '';
        document.getElementById('novo-cli-email').value = data.email || '';
        document.getElementById('novo-cli-cpf').value = data.cpf || '';
        document.getElementById('novo-cli-empresa').value = data.empresa || '';
        document.getElementById('novo-cli-endereco').value = data.endereco || '';
    } catch (e) {
        console.error("Erro ao carregar detalhes cliente:", e);
    }
}

// ===================================
// CLIENTE RÁPIDO (Orçamento)
// ===================================

function toggleNovoCliente() {
    const form = document.getElementById('form-novo-cliente');
    if (!form) return;
    form.classList.toggle('hidden');

    // Foca no nome se abriu
    if (!form.classList.contains('hidden')) {
        setTimeout(() => document.getElementById('novo-cli-nome')?.focus(), 100);
    }
}

async function salvarClienteRapido() {
    const nome = document.getElementById('novo-cli-nome').value.trim();
    const tel = document.getElementById('novo-cli-phone').value.trim();
    const email = document.getElementById('novo-cli-email').value.trim();
    const documento = document.getElementById('novo-cli-cpf').value.trim();
    const empresa = document.getElementById('novo-cli-empresa').value.trim();
    const endereco = document.getElementById('novo-cli-endereco').value.trim();

    if (!nome) return alert("Por favor, preencha o nome do cliente.");

    try {
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return alert("Sessão expirada. Faça login novamente.");

        // Objeto cliente
        const novoCliente = {
            user_id: user.id,
            nome: nome,
            phone: tel,
            email: email,
            cpf: documento,
            empresa: empresa,
            endereco: endereco,
            created_at: new Date().toISOString()
        };

        const { data, error } = await sb.from('clientes').insert([novoCliente]).select();

        if (error) throw error;
        if (!data || data.length === 0) throw new Error("Erro ao retornar ID do cliente.");

        alert("Cliente registado com sucesso! ✅");

        // Limpa campos
        document.getElementById('novo-cli-nome').value = '';
        document.getElementById('novo-cli-phone').value = '';
        document.getElementById('novo-cli-email').value = '';
        document.getElementById('novo-cli-cpf').value = '';
        document.getElementById('novo-cli-empresa').value = '';
        document.getElementById('novo-cli-endereco').value = '';

        // Fecha formulário
        document.getElementById('form-novo-cliente').classList.add('hidden');

        // Recarrega selects
        await carregarSelectClientes();
        await carregarListaClientes();

        // Seleciona o novo cliente
        document.getElementById('select-cliente').value = data[0].id;
    } catch (e) {
        console.error("Erro ao salvar cliente rápido:", e);
        alert("Erro ao salvar cliente. Tente novamente.");
    }
}
