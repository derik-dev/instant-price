// Força atualização de cache - versão 2025-01-29-EURO-FIX
console.log('🔧 APP.JS CARREGADO - VERSÃO EURO-FIX 2025-01-29');

const PROJECT_URL = 'https://hjeqxocuuquosfapibxo.supabase.co';
const PROJECT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqZXF4b2N1dXF1b3NmYXBpYnhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4OTAyMjUsImV4cCI6MjA4MjQ2NjIyNX0.K4nIiH_N22CCVwBWfBkwfJtn65m96QS8iQSAO35iOFU';

let sb = null;
try {
    if (window.supabase) sb = window.supabase.createClient(PROJECT_URL, PROJECT_KEY);
    else console.error("ERRO: Biblioteca Supabase não carregou.");
} catch (e) { console.error(e); }

function setBtnLoading(btn, isLoading, text = "Aguarde...") {
    if (!btn) return;
    if (isLoading) {
        btn.dataset.originalContent = btn.innerHTML;
        btn.innerHTML = `<i class="ph-bold ph-spinner animate-spin"></i> ${text}`;
        btn.disabled = true;
        btn.classList.add('opacity-70', 'cursor-not-allowed');
    } else {
        btn.innerHTML = btn.dataset.originalContent || text;
        btn.disabled = false;
        btn.classList.remove('opacity-70', 'cursor-not-allowed');
    }
}

const COTACOES_PADRAO = { 'USD': 1.0, 'EUR': 1.0 }; // Forçado 1.0 para evitar conversões indesejadas pós-migração
const MOEDA_PADRAO_FORCADA = 'EUR';

function converterParaEuro(valor, moedaOrigem) {
    if (!valor) return 0;
    const m = moedaOrigem || 'EUR';
    if (m === 'EUR') return parseFloat(valor);

    const valorEmEUR = parseFloat(valor) * (COTACOES_PADRAO[m] || 1);
    return valorEmEUR;
}

// Helper para parsear moeda (PT-PT/BR: 1.000,00 -> 1000.00)
function parseMoeda(valor) {
    if (typeof valor === 'number') return valor;
    if (!valor) return 0;
    // Remove €, espaços, pontos (separador de milhar) e troca vírgula por ponto (decimal)
    let limpo = valor.toString()
        .replace('€', '')
        .replace(/\s/g, '')
        .replace(/\./g, '')
        .replace(',', '.');
    return parseFloat(limpo) || 0;
}

document.addEventListener('DOMContentLoaded', async () => {
    const pagina = window.location.pathname.split('/').pop() || 'index.html';
    const paginasLivres = ['index.html', 'login.html'];
    if (sb) {
        const { data } = await sb.auth.getSession();
        if (!paginasLivres.includes(pagina) && !data.session) window.location.href = 'login.html';
        else if (pagina === 'login.html' && data.session) window.location.href = 'dashboard.html';
    }

    if (document.getElementById('lista-orcamentos-recentes')) { carregarOrcamentosRecentes(); atualizarKPIs(); verificarPreenchimentoCadastro(); }
    if (document.getElementById('lista-clientes')) carregarListaClientes();
    if (document.getElementById('select-cliente')) carregarSelectClientes();
    if (window.location.pathname.includes('detalhes.html')) carregarDetalhes();
    if (document.getElementById('tabela-catalogo')) carregarCatalogo();
    if (document.getElementById('tabela-completa')) carregarPaginaOrcamentos();
    if (document.getElementById('conf-nome')) carregarConfiguracoesSupabase();
    if (sb) carregarDadosUsuario();

    // Attach currency mask globally to potential item fields if they exist
    const camposPrecoItem = ['item-preco', 'item-mao-obra', 'item-frete'];
    camposPrecoItem.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', () => formatarCampoMoedaGlobal(input));
            input.addEventListener('blur', () => finalizarFormatacaoMoedaGlobal(input));
        }
    });
});

// Formatar valores monetários (€) - apenas limpa caracteres inválidos durante digitação
function formatarCampoMoedaGlobal(input) {
    let valor = input.value.replace(/[^\d.,]/g, '');
    input.value = valor;
}

// Finalizar formatação ao sair do campo (blur)
function finalizarFormatacaoMoedaGlobal(input) {
    let valor = input.value.trim();
    if (valor === '') return;

    // Se o utilizador já colocou vírgula, manter como está
    if (valor.includes(',')) {
        const partes = valor.split(',');
        let inteiro = partes[0];
        let decimal = (partes[1] || '').slice(0, 2).padEnd(2, '0');
        input.value = inteiro + ',' + decimal;
    } else {
        // Se não tem vírgula, adicionar ,00
        let limpo = valor.replace(/\./g, '');
        if (limpo && !isNaN(limpo)) {
            input.value = limpo + ',00';
        }
    }
}

async function processarAuth() {
    if (!sb) return alert("Erro crítico: Supabase não carregado.");
    const email = document.getElementById('input-email').value;
    const senha = document.getElementById('input-password').value;
    const btn = document.querySelector('button[type="submit"]');
    const divNome = document.getElementById('field-name');

    // Verifica visibilidade do campo nome
    const isCadastro = divNome && (!divNome.classList.contains('hidden') || divNome.style.opacity === '1');
    const nome = document.getElementById('input-name') ? document.getElementById('input-name').value : '';

    if (!email || !senha) return alert("Preencha todos os campos.");
    if (isCadastro && !nome) return alert("Preencha seu nome.");

    setBtnLoading(btn, true, isCadastro ? "A criar conta..." : "A entrar...");

    try {
        if (isCadastro) {
            if (senha.length < 6) throw new Error("Senha min. 6 caracteres.");
            const { error } = await sb.auth.signUp({
                email,
                password: senha,
                options: {
                    data: {
                        full_name: nome,
                        display_name: nome,
                        nome: nome
                    }
                }
            });
            if (error) throw error;
            alert("Conta criada! Bem-vindo."); window.location.href = 'dashboard.html';
        } else {
            const { error } = await sb.auth.signInWithPassword({ email, password: senha });
            if (error) throw error;
            window.location.href = 'dashboard.html';
        }
    } catch (err) {
        let msg = err.message || "Erro desconhecido";
        if (msg.includes("Invalid login")) msg = "E-mail ou senha incorretos.";
        alert(msg);
        setBtnLoading(btn, false);
    }
}

async function sair() { if (confirm("Sair?")) { await sb.auth.signOut(); window.location.href = 'index.html'; } }

async function carregarDadosUsuario() {
    try {
        const { data: { user } } = await sb.auth.getUser();
        if (user) {
            console.log("=== DEBUG USUÁRIO SUPABASE ===");
            console.log("metadata:", user.user_metadata);

            // Prioridade de display
            let nomeReal =
                user.user_metadata.full_name ||
                user.user_metadata.display_name ||
                user.user_metadata.nome ||
                user.user_metadata.name;

            // Fallback: Busca na tabela empresas se não encontrou no metadata
            if (!nomeReal) {
                console.log("Nome não encontrado no metadata. Buscando em 'empresas'...");
                const { data: empresa } = await sb.from('empresas').select('nome').eq('user_id', user.id).maybeSingle();
                if (empresa && empresa.nome) {
                    nomeReal = empresa.nome;
                }
            }

            // Fallback final: Email
            if (!nomeReal && user.email) {
                console.log("Usando fallback de email.");
                nomeReal = user.email.split('@')[0];
                nomeReal = nomeReal.charAt(0).toUpperCase() + nomeReal.slice(1);
            }

            nomeReal = nomeReal || 'Utilizador';

            console.log("Nome Definido:", nomeReal);

            document.querySelectorAll('#user-name-display').forEach(el => el.innerText = nomeReal);
            atualizarSaudacao();
        }
    } catch (e) {
        console.error("Erro ao carregar usuario", e);
    }
}

function atualizarSaudacao() { const el = document.getElementById('saudacao-tempo'); if (el) { const h = new Date().getHours(); el.innerText = h < 12 ? 'Bom dia' : (h < 18 ? 'Boa tarde' : 'Boa noite'); } }

async function carregarOrcamentosRecentes() {
    const ul = document.getElementById('lista-orcamentos-recentes');
    if (!ul) return;

    try {
        const { data: lista } = await sb.from('orcamentos').select('*').order('created_at', { ascending: false }).limit(5);
        const { data: clientes } = await sb.from('clientes').select('id, nome');

        // Criar mapa de nomes por ID
        const mapaNomes = {};
        if (clientes) {
            clientes.forEach(c => mapaNomes[c.id] = c.nome);
        }

        ul.innerHTML = '';

        if (!lista || lista.length === 0) {
            ul.innerHTML = '<li class="text-center text-slate-400 py-8">Nenhum orçamento recente.</li>';
            return;
        }

        // Cotações (mesmas do KPI)
        const cotacoes = { 'USD': 6.0, 'EUR': 6.5 };

        lista.forEach(orc => {
            let statusColor = orc.status === 'Aprovado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700';
            let icon = orc.status === 'Aprovado' ? 'ph-check-circle' : 'ph-clock'; // Fallback icon

            // Buscar nome do cliente pelo ID
            const clienteId = parseInt(orc.cliente);
            const nomeCliente = !isNaN(clienteId) && mapaNomes[clienteId] ? mapaNomes[clienteId] : orc.cliente;

            // Converte para Euro para exibição padronizada
            let valorEuro = converterParaEuro(orc.valor, orc.moeda);
            let displayValor = formatarMoeda(valorEuro);

            ul.innerHTML += `
            <li class="py-4 flex items-center justify-between hover:bg-slate-50 transition-colors rounded-lg px-2 -mx-2">
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-full ${statusColor} flex items-center justify-center">
                        <i class="ph-bold ${icon} text-xl"></i>
                    </div>
                    <div>
                        <p class="font-bold text-slate-800 text-sm">${nomeCliente}</p>
                        <p class="text-xs text-slate-400">${formatarData(orc.created_at)}</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="font-bold text-slate-900 text-sm">${displayValor}</p>
                    <a href="detalhes.html?id=${orc.id}" class="text-xs font-bold text-blue-600 hover:text-blue-800">Ver detalhes</a>
                </div>
            </li>`;
        });
    } catch (e) {
        console.error("Erro ao carregar recentes:", e);
    }
}

// ===================================
// CLIENTES (CRUD Completo)
// ===================================
function novoCliente() {
    const form = document.getElementById('form-cliente');
    if (form) form.reset();
    document.getElementById('cli-id').value = '';
    document.getElementById('modal-cliente-titulo').innerText = 'Novo Cliente';
    const btn = document.querySelector('button[onclick="salvarCliente()"]');
    if (btn) btn.innerHTML = '<i class="ph-bold ph-check"></i> Guardar Cliente';
    toggleModal('modal-cliente', 'open');
}

async function editarCliente(id) {
    try {
        const { data: cli, error } = await sb.from('clientes').select('*').eq('id', id).single();
        if (error) throw error;

        document.getElementById('cli-id').value = cli.id;
        document.getElementById('cli-nome').value = cli.nome;
        document.getElementById('cli-email').value = cli.email || '';
        document.getElementById('cli-phone').value = cli.phone || '';
        document.getElementById('cli-empresa').value = cli.empresa || '';
        document.getElementById('cli-cpf').value = cli.cpf || '';
        document.getElementById('cli-endereco').value = cli.endereco || '';

        document.getElementById('modal-cliente-titulo').innerText = 'Editar Cliente';
        const btn = document.querySelector('button[onclick="salvarCliente()"]');
        if (btn) btn.innerHTML = '<i class="ph-bold ph-floppy-disk"></i> Atualizar Cliente';

        toggleModal('modal-cliente', 'open');
    } catch (err) { alert("Erro ao carregar cliente: " + err.message); }
}

async function salvarCliente() {
    const btn = document.querySelector('button[onclick="salvarCliente()"]');
    const id = document.getElementById('cli-id').value;
    const nome = document.getElementById('cli-nome').value;
    const email = document.getElementById('cli-email').value;
    const phone = document.getElementById('cli-phone').value;
    const empresa = document.getElementById('cli-empresa') ? document.getElementById('cli-empresa').value : '';
    const cpf = document.getElementById('cli-cpf') ? document.getElementById('cli-cpf').value : '';
    const endereco = document.getElementById('cli-endereco') ? document.getElementById('cli-endereco').value : '';

    if (!nome) return alert("Nome obrigatório");

    if (btn) setBtnLoading(btn, true, "A guardar...");

    try {
        const { data: { user } } = await sb.auth.getUser();
        let error;

        if (id) {
            // Update
            const { error: err } = await sb.from('clientes').update({ nome, email, phone, empresa, cpf, endereco }).eq('id', id);
            error = err;
        } else {
            // Insert
            const { error: err } = await sb.from('clientes').insert([{ nome, email, phone, empresa, cpf, endereco, user_id: user.id }]);
            error = err;
        }

        if (error) throw error;

        toggleModal('modal-cliente', 'close');
        document.getElementById('form-cliente').reset();
        carregarListaClientes();
        if (document.getElementById('select-cliente')) carregarSelectClientes();

    } catch (err) {
        alert(err.message);
    } finally {
        if (btn) setBtnLoading(btn, false, id ? '<i class="ph-bold ph-floppy-disk"></i> Atualizar Cliente' : '<i class="ph-bold ph-check"></i> Guardar Cliente');
    }
}

async function carregarListaClientes() {
    const tbody = document.getElementById('lista-clientes'); if (!tbody) return;
    const { data: clientes } = await sb.from('clientes').select('*').order('created_at', { ascending: false });

    tbody.innerHTML = '';
    if (!clientes || clientes.length === 0) {
        document.getElementById('lista-clientes-empty').classList.remove('hidden');
        return;
    }

    document.getElementById('lista-clientes-empty').classList.add('hidden');
    clientes.forEach(cli => {
        tbody.innerHTML += `
        <tr class="hover:bg-slate-50 border-b border-slate-100">
            <td class="p-5 pl-8 font-bold text-slate-800">${cli.nome}<br><span class="text-xs font-normal text-slate-400">${cli.empresa || ''}</span></td>
            <td class="p-5 hidden md:table-cell text-slate-500">${cli.cpf || '-'}</td>
            <td class="p-5 hidden md:table-cell text-slate-500">${cli.email || '-'}</td>
            <td class="p-5 hidden md:table-cell text-slate-500">${cli.phone || '-'}</td>
            <td class="p-5 hidden lg:table-cell text-slate-500 text-xs max-w-[200px] truncate" title="${cli.endereco || ''}">${cli.endereco || '-'}</td>
            <td class="p-5 text-right pr-8 flex justify-end gap-2">
                <button onclick="editarCliente(${cli.id})" class="text-slate-400 hover:text-blue-500 p-2 hover:bg-blue-50 rounded-full transition-colors"><i class="ph-bold ph-pencil-simple"></i></button>
                <button onclick="removerCliente(${cli.id})" class="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition-colors"><i class="ph-bold ph-trash"></i></button>
            </td>
        </tr>`;
    });
}

async function removerCliente(id) {
    if (!confirm("Tem a certeza que deseja eliminar este cliente?")) return;
    try {
        const { error } = await sb.from('clientes').delete().eq('id', id);
        if (error) throw error;
        carregarListaClientes();
        if (document.getElementById('select-cliente')) carregarSelectClientes();
    } catch (err) {
        alert("Erro ao eliminar cliente. Verifique se ele não possui orçamentos vinculados.");
        console.error(err);
    }
}
async function carregarSelectClientes() {
    const sel = document.getElementById('select-cliente');
    if (!sel) return;
    const { data: clientes } = await sb.from('clientes').select('id, nome').order('nome');
    sel.innerHTML = '<option value="">Selecione um cliente...</option>';
    if (clientes) clientes.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;  // Salva o ID do cliente
        opt.innerText = c.nome;
        sel.appendChild(opt);
    });
}

// ===================================
// ITENS / CATÁLOGO
// ===================================

function toggleTipoItem() {
    const tipoEl = document.getElementById('item-tipo');
    const boxMaoObra = document.getElementById('box-mao-obra');
    const boxFrete = document.getElementById('box-frete');
    const freteInput = document.getElementById('item-frete');
    const moInput = document.getElementById('item-mao-obra');

    if (!tipoEl || !boxMaoObra || !boxFrete) return;

    if (tipoEl.value === 'Serviço') {
        boxMaoObra.classList.remove('hidden');
        boxFrete.classList.add('hidden');
        if (freteInput) freteInput.value = '';
    } else {
        boxMaoObra.classList.add('hidden');
        boxFrete.classList.remove('hidden');
        if (moInput) moInput.value = '';
    }
}

function novoItem() {
    const form = document.getElementById('form-item');
    if (form) form.reset();
    document.getElementById('item-id').value = '';
    document.getElementById('modal-item-titulo').innerText = 'Novo Item';
    const btn = document.querySelector('button[onclick="salvarItem()"]');
    if (btn) btn.innerHTML = '<i class="ph-bold ph-check"></i> Guardar Item';
    toggleModal('modal-item', 'open');
    toggleTipoItem(); // Reset UI state
}

async function editarItem(id) {
    try {
        const { data: item, error } = await sb.from('itens').select('*').eq('id', id).single();
        if (error) throw error;

        document.getElementById('item-id').value = item.id;
        document.getElementById('item-nome').value = item.nome;
        document.getElementById('item-tipo').value = item.tipo;
        document.getElementById('item-preco').value = item.preco;
        if (document.getElementById('item-mao-obra')) document.getElementById('item-mao-obra').value = item.mao_de_obra || 0;
        if (document.getElementById('item-frete')) document.getElementById('item-frete').value = item.frete || 0;
        document.getElementById('item-descricao').value = item.descricao || '';

        toggleTipoItem(); // Ajusta visibilidade baseada no tipo carregado

        document.getElementById('modal-item-titulo').innerText = 'Editar Item';
        const btn = document.querySelector('button[onclick="salvarItem()"]');
        if (btn) btn.innerHTML = '<i class="ph-bold ph-floppy-disk"></i> Atualizar Item';

        toggleModal('modal-item', 'open');
    } catch (err) { alert("Erro ao carregar item: " + err.message); }
}

async function salvarItem() {
    const btn = document.querySelector('button[onclick="salvarItem()"]');
    // Ensure element exists before accessing value to avoid null pointer issues
    const idElem = document.getElementById('item-id');
    const id = idElem ? idElem.value : null;

    const nome = document.getElementById('item-nome').value;
    const preco = parseMoeda(document.getElementById('item-preco').value);
    const tipo = document.getElementById('item-tipo').value;
    const descricao = document.getElementById('item-descricao').value;
    const mao_de_obra = document.getElementById('item-mao-obra') ? parseMoeda(document.getElementById('item-mao-obra').value) : 0;
    const frete = document.getElementById('item-frete') ? parseMoeda(document.getElementById('item-frete').value) : 0;

    if (!nome || !preco) return alert("Preencha campos Nome e Preço.");

    if (btn) setBtnLoading(btn, true, "A guardar...");

    try {
        const { data: { user } } = await sb.auth.getUser();
        let error;

        const payload = {
            nome,
            preco: preco,
            mao_de_obra: mao_de_obra,
            frete: frete,
            tipo,
            descricao,
            user_id: user.id
        };

        if (id) {
            // Update
            const { error: err } = await sb.from('itens').update(payload).eq('id', id);
            error = err;
        } else {
            // Insert
            const { error: err } = await sb.from('itens').insert([payload]);
            error = err;
        }

        if (error) throw error;

        // Check if we are in a modal or standalone page
        const modal = document.getElementById('modal-item');
        // If modal exists and is not hidden (simple check), we close it. 
        // Better check: are we on 'catalogo.html'?
        if (modal && !modal.classList.contains('hidden')) {
            toggleModal('modal-item', 'close');
            document.getElementById('form-item').reset();
            carregarCatalogo();
        } else {
            // Standalone page behavior
            alert("Item guardado com sucesso!");
            window.location.href = 'catalogo.html';
        }

    } catch (err) {
        console.error(err);
        alert(err.message);
    } finally {
        if (btn) setBtnLoading(btn, false, id ? '<i class="ph-bold ph-floppy-disk"></i> Atualizar Item' : '<i class="ph-bold ph-check"></i> Guardar Item');
    }
}

async function carregarCatalogo() {
    const tbody = document.getElementById('tabela-catalogo'); if (!tbody) return;
    const { data: itens } = await sb.from('itens').select('*').order('created_at', { ascending: false });

    tbody.innerHTML = '';
    const contador = document.getElementById('contador-itens'); if (contador) contador.innerText = `(${itens ? itens.length : 0})`;

    if (!itens || itens.length === 0) {
        document.getElementById('empty-state-catalogo').classList.remove('hidden');
        return;
    }

    document.getElementById('empty-state-catalogo').classList.add('hidden');
    itens.forEach(item => {
        tbody.innerHTML += `
        <tr class="hover:bg-slate-50 border-b border-slate-100 group">
            <td class="p-4 pl-6"><div class="flex flex-col"><span class="text-xs uppercase font-bold text-slate-400 mb-0.5">${item.tipo}</span><span class="font-bold text-slate-900">${item.nome}</span></div></td>
            <td class="p-4 hidden md:table-cell text-slate-500 truncate max-w-xs">${item.descricao || '-'}</td>
            <td class="p-4 font-bold text-slate-700">${formatarMoeda(item.preco)}</td>
            <td class="p-4 pr-6 text-right flex justify-end gap-1">
                <button onclick="editarItem(${item.id})" class="text-slate-400 hover:text-blue-500 p-2 hover:bg-blue-50 rounded-full transition-colors"><i class="ph-bold ph-pencil-simple"></i></button>
                <button onclick="removerItem(${item.id})" class="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition-colors"><i class="ph-bold ph-trash"></i></button>
            </td>
        </tr>`;
    });
}

async function removerItem(id) {
    if (!confirm("Eliminar item?")) return;
    try {
        const { error } = await sb.from('itens').delete().eq('id', id);
        if (error) throw error;
        carregarCatalogo();
    } catch (e) {
        alert("Erro ao eliminar item. Pode estar em uso em algum orçamento.");
        console.error(e);
    }
}

window.salvarOrcamentoCompleto = async function () {
    const btn = document.querySelector('button[onclick="salvarOrcamentoCompleto()"]') || document.querySelector('button[onclick="criarOrcamento()"]');

    // Verificar se está em modo de edição
    const editIdEl = document.getElementById('edit-orcamento-id');
    const editId = editIdEl ? editIdEl.value : null;
    const isEditMode = editId && editId.length > 0;

    // Salvar cliente automaticamente se for novo
    let clienteId = window.salvarClienteSeNovo ? await window.salvarClienteSeNovo() : document.getElementById('select-cliente').value;

    const cliente = clienteId;
    const valorEl = document.getElementById('orc-valor') || document.getElementById('input-valor');
    let valorTexto = valorEl.value || valorEl.innerText;

    // Usa parseMoeda para interpretar corretamente
    const valor = parseMoeda(valorTexto);

    if (!cliente) return alert("Selecione ou preencha os dados do cliente.");
    if (isNaN(valor) || valor <= 0) return alert("Valor inválido. Use o formato: 250,00");

    const servico = document.getElementById('input-descricao') ? document.getElementById('input-descricao').value : (document.getElementById('orc-descricao') ? document.getElementById('orc-descricao').innerText : '');
    const prazo = document.getElementById('input-prazo') ? document.getElementById('input-prazo').value : '0';
    const pagamento = document.getElementById('select-pagamento') ? document.getElementById('select-pagamento').value : 'A vista';
    const pix = document.getElementById('input-chave-pix') ? document.getElementById('input-chave-pix').value : '';
    const moeda = 'EUR';

    // Pega mão de obra total (campo oculto preenchido pela função atualizarTabelaItens)
    const maoObraEl = document.getElementById('input-mao-obra-total');
    const maoObraTotal = maoObraEl ? parseFloat(maoObraEl.value) || 0 : 0;

    // Pega itens JSON
    const itensJsonEl = document.getElementById('input-itens-json');
    let itensJson = [];
    try {
        itensJson = itensJsonEl && itensJsonEl.value ? JSON.parse(itensJsonEl.value) : [];
    } catch (e) {
        console.error("Erro parsing itens JSON", e);
    }

    if (!cliente) return alert("Selecione um cliente.");

    if (btn) setBtnLoading(btn, true, isEditMode ? "A Atualizar..." : "A Gerar Documento...");

    try {
        const { data: { user } } = await sb.auth.getUser();

        const payload = {
            cliente,
            valor: parseFloat(valor),
            mao_de_obra: maoObraTotal,
            servico,
            prazo,
            pagamento,
            chave_pix: pix,
            moeda,
            itens_json: itensJson
        };

        let resultId;

        if (isEditMode) {
            // Modo EDIÇÃO: fazer UPDATE
            const { data: updatedOrc, error } = await sb.from('orcamentos')
                .update(payload)
                .eq('id', editId)
                .select();

            if (error) throw error;
            resultId = editId;
            console.log('Orçamento atualizado:', updatedOrc);
        } else {
            // Modo CRIAÇÃO: fazer INSERT
            payload.status = 'Pendente';
            payload.user_id = user.id;

            const { data: novoOrc, error } = await sb.from('orcamentos')
                .insert([payload])
                .select();

            if (error) throw error;
            resultId = novoOrc[0].id;
            console.log('Orçamento criado:', novoOrc);
        }

        window.location.href = `detalhes.html?id=${resultId}`;
    } catch (err) {
        alert(err.message);
        if (btn) setBtnLoading(btn, false, isEditMode ? 'Atualizar' : 'Guardar');
    }
}

async function carregarPaginaOrcamentos() {
    const tbody = document.getElementById('tabela-completa'); if (!tbody) return;

    // Busca orçamentos e todos os clientes para mapear por ID
    const { data: lista } = await sb.from('orcamentos').select('*').order('created_at', { ascending: false });
    const { data: clientes } = await sb.from('clientes').select('id, nome, email');

    // Cria mapas por ID: { id: { nome, email } }
    const mapaNomes = {};
    const mapaEmails = {};
    if (clientes) {
        clientes.forEach(c => {
            mapaNomes[c.id] = c.nome;
            mapaEmails[c.id] = c.email;
        });
    }

    tbody.innerHTML = '';
    if (!lista) return;

    lista.forEach(orc => {
        let status = orc.status === 'Aprovado' ? `<span class="px-2 py-0.5 rounded text-xs font-bold bg-green-50 text-green-700 border border-green-200">Aprovado</span>` : `<span class="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">Pendente</span>`;

        // Busca nome e email pelo ID (ou usa o valor antigo se for nome)
        const clienteId = parseInt(orc.cliente);
        const nomeCliente = !isNaN(clienteId) && mapaNomes[clienteId] ? mapaNomes[clienteId] : orc.cliente;
        const email = !isNaN(clienteId) && mapaEmails[clienteId] ? mapaEmails[clienteId] : '--';

        // Conversão e formatação na moeda padrão do usuário (EUR)
        let valorEuro = converterParaEuro(orc.valor, orc.moeda);
        let displayValor = `<span class="text-green-600">${formatarMoeda(valorEuro)}</span>`;

        tbody.innerHTML += `
        <tr class="hover:bg-slate-50/80 transition-colors group cursor-pointer" onclick="window.location.href='criar-orcamento.html?edit=${orc.id}'">
            <td class="p-4 pl-6 font-bold text-slate-900">${nomeCliente}</td>
            <td class="p-4 hidden md:table-cell text-slate-500 text-sm">${email}</td>
            <td class="p-4 font-bold whitespace-nowrap">${displayValor}</td>
            <td class="p-4 hidden md:table-cell">${status}</td>
            <td class="p-4 hidden lg:table-cell text-slate-500">${formatarData(orc.created_at)}</td>
            <td class="p-4 pr-6 text-center flex justify-center gap-1" onclick="event.stopPropagation()">
                <a href="detalhes.html?id=${orc.id}" class="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:text-blue-600" title="Ver"><i class="ph-bold ph-eye"></i></a>
                <a href="criar-orcamento.html?edit=${orc.id}" class="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:text-amber-600" title="Editar"><i class="ph-bold ph-pencil-simple"></i></a>
                ${orc.status !== 'Aprovado' ? `<button onclick="aprovarOrcamento(${orc.id})" class="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:text-green-600" title="Aprovar"><i class="ph-bold ph-check"></i></button>` : ''}
                <button onclick="removerOrcamento(${orc.id})" class="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:text-red-600" title="Remover"><i class="ph-bold ph-trash"></i></button>
            </td>
        </tr>`;
    });
}

function formatarMoeda(v) {
    // Força Euro de forma absoluta para evitar qualquer conversão indevida
    const valor = parseFloat(v);
    if (isNaN(valor)) return '€ 0,00';

    // Formatação manual para garantir controle total
    const partes = valor.toFixed(2).split('.');
    partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.'); // Separador de milhar
    return '€ ' + partes.join(','); // Separador decimal
}
function formatarData(d) { return d ? new Date(d).toLocaleDateString('pt-PT') : '--/--'; }
function toggleModal(id, a) { const m = document.getElementById(id); if (m) { a === 'open' ? m.classList.remove('hidden') : m.classList.add('hidden'); } }

async function aprovarOrcamento(id) { if (confirm("Aprovar?")) { await sb.from('orcamentos').update({ status: 'Aprovado' }).eq('id', id); if (document.getElementById('tabela-completa')) carregarPaginaOrcamentos(); else atualizarKPIs(); } }
async function removerOrcamento(id) { if (confirm("Eliminar?")) { await sb.from('orcamentos').delete().eq('id', id); if (document.getElementById('tabela-completa')) carregarPaginaOrcamentos(); else { carregarOrcamentosRecentes(); atualizarKPIs(); } } }
async function atualizarKPIs() {
    const kpiTotal = document.getElementById('kpi-total');
    if (!kpiTotal) return;

    const { data: orcamentos } = await sb.from('orcamentos').select('valor, status, moeda');
    const { count: clientes } = await sb.from('clientes').select('*', { count: 'exact', head: true });
    const { count: itens } = await sb.from('itens').select('*', { count: 'exact', head: true });
    if (!orcamentos) return;

    const aprovados = orcamentos.filter(o => o.status === 'Aprovado');

    // Soma convertida para EUR
    const faturado = aprovados.reduce((acc, c) => acc + (converterParaEuro(c.valor, c.moeda) || 0), 0);

    const faturadoDisplay = faturado;

    const taxa = orcamentos.length > 0 ? Math.round((aprovados.length / orcamentos.length) * 100) : 0;
    kpiTotal.innerText = orcamentos.length;
    if (document.getElementById('kpi-faturado')) document.getElementById('kpi-faturado').innerText = formatarMoeda(faturadoDisplay);
    if (document.getElementById('kpi-aprovado')) document.getElementById('kpi-aprovado').innerText = aprovados.length;
    if (document.getElementById('kpi-pendente')) document.getElementById('kpi-pendente').innerText = orcamentos.length - aprovados.length;
    if (document.getElementById('kpi-clientes')) document.getElementById('kpi-clientes').innerText = clientes || 0;
    if (document.getElementById('kpi-itens-dash')) document.getElementById('kpi-itens-dash').innerText = itens || 0;
    const bar = document.getElementById('bar-conversao');
    if (bar) bar.style.width = `${taxa}%`;
    const txt = document.getElementById('meta-conversao-text');
    if (txt) txt.innerText = `${taxa}%`;
    atualizarSaudacao();
}

// ===================================
// VERIFICAR PREENCHIMENTO DO CADASTRO
// ===================================
async function verificarPreenchimentoCadastro() {
    const banner = document.getElementById('banner-config-pendente');
    const barCadastro = document.getElementById('bar-cadastro');
    const percentCadastro = document.getElementById('cadastro-percent');
    const msgCadastro = document.getElementById('cadastro-msg');

    if (!banner || !barCadastro) return;

    try {
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return;

        const { data: empresa } = await sb.from('empresas').select('*').eq('user_id', user.id).maybeSingle();

        // Calcula preenchimento (4 campos: nome, doc, tel, endereco) - PIX opcional
        let camposPreenchidos = 0;
        const totalCampos = 4;

        if (empresa) {
            if (empresa.nome) camposPreenchidos++;
            if (empresa.doc) camposPreenchidos++;
            if (empresa.tel) camposPreenchidos++;
            if (empresa.endereco) camposPreenchidos++;
        }

        const percentual = Math.round((camposPreenchidos / totalCampos) * 100);

        // Atualiza a barra de progresso
        barCadastro.style.width = `${percentual}%`;
        percentCadastro.innerText = `${percentual}%`;

        if (percentual === 100) {
            // Cadastro completo
            banner.classList.add('hidden');
            barCadastro.classList.remove('bg-amber-500');
            barCadastro.classList.add('bg-green-500');
            percentCadastro.classList.remove('text-amber-600');
            percentCadastro.classList.add('text-green-600');
            msgCadastro.innerHTML = '<span class="text-green-600">✓ Seus dados da empresa estão completos!</span>';
        } else {
            // Cadastro incompleto - mostra banner
            banner.classList.remove('hidden');

            if (percentual >= 60) {
                barCadastro.classList.remove('bg-amber-500');
                barCadastro.classList.add('bg-yellow-500');
                percentCadastro.classList.remove('text-amber-600');
                percentCadastro.classList.add('text-yellow-600');
            }
        }

    } catch (e) {
        console.error("Erro ao verificar cadastro:", e);
    }
}

// ===================================
// DETALHES DO ORÇAMENTO
// ===================================
async function carregarDetalhes() {
    const id = new URLSearchParams(window.location.search).get('id');
    if (!id) { alert("ID do orçamento não encontrado."); return; }

    const { data: orc, error } = await sb.from('orcamentos').select('*').eq('id', id).single();
    if (error || !orc) { alert("Orçamento não encontrado"); window.location.href = 'orcamentos.html'; return; }

    // Popula dados do orçamento
    if (document.getElementById('orc-id')) document.getElementById('orc-id').innerText = `#${String(orc.id).padStart(4, '0')}`;


    if (document.getElementById('orc-data')) document.getElementById('orc-data').innerText = formatarData(orc.created_at);
    if (document.getElementById('orc-valor')) document.getElementById('orc-valor').innerText = formatarMoeda(orc.valor);
    if (document.getElementById('orc-pagamento')) {
        const pagamento = orc.pagamento || 'A combinar';
        const pagamentoFormatado = {
            'pix': 'PIX',
            'boleto': 'Boleto Bancário',
            'credito': 'Cartão de Crédito',
            'debito': 'Cartão de Débito'
        }[pagamento.toLowerCase()] || pagamento;
        document.getElementById('orc-pagamento').innerText = pagamentoFormatado;
    }
    if (document.getElementById('orc-prazo')) document.getElementById('orc-prazo').innerText = `${orc.prazo || '0'} Dias`;
    if (document.getElementById('orc-status')) {
        const status = orc.status || 'Pendente';
        document.getElementById('orc-status').innerText = status;
    }
    // Calcula validade (15 dias a partir da data de emissão)
    if (document.getElementById('orc-validade')) {
        const dataEmissao = new Date(orc.created_at);
        const dataValidade = new Date(dataEmissao);
        dataValidade.setDate(dataValidade.getDate() + 15);
        document.getElementById('orc-validade').innerText = formatarData(dataValidade.toISOString());
    }

    // Popula tabela de itens
    const tbody = document.getElementById('tbody-itens');
    const itensJson = orc.itens_json || null;
    let totalProd = 0;
    let totalMO = Number(orc.mao_de_obra) || 0;
    let totalFrete = 0;

    if (itensJson && Array.isArray(itensJson) && itensJson.length > 0) {
        tbody.innerHTML = ''; // Limpa "Carregando..."

        // Recalcula totais baseados no JSON para precisão
        totalProd = 0;
        totalMO = 0;

        itensJson.forEach(item => {
            const qtd = item.qtd || 1;
            const p = Number(item.preco) || 0;
            const mo = Number(item.mao_de_obra) || 0;
            const frete = Number(item.frete) || 0;

            const subProd = p * qtd;
            const subMO = mo * qtd;
            const subFrete = frete * qtd;

            totalProd += subProd;
            totalMO += subMO;
            totalFrete += subFrete;

            const valTotalItem = subProd + subMO + subFrete;

            tbody.innerHTML += `
            <tr class="border-0">
                <td class="p-1" colspan="2">
                    <div class="bg-slate-50 rounded-xl p-2.5 border border-gray-100 flex justify-between items-start gap-2">
                        <div class="flex flex-col flex-1">
                            <span class="text-[11px] font-bold text-black">${item.nome}</span>
                            ${item.descricao ? `<span class="text-[9px] text-gray-600 mt-0.5 leading-tight">${item.descricao.replace(/\n/g, '<br>')}</span>` : ''}
                            ${(subMO > 0 || subFrete > 0) ? `<span class="text-[9px] text-gray-400 mt-1 pt-1 border-t border-gray-200 inline-block w-full">${subMO > 0 ? `M.O: ${formatarMoeda(subMO)}` : ''} ${subMO > 0 && subFrete > 0 ? '•' : ''} ${subFrete > 0 ? `Frete: ${formatarMoeda(subFrete)}` : ''}</span>` : ''}
                        </div>
                        <div class="text-right flex-shrink-0">
                            <span class="text-[11px] font-mono text-black font-bold block">${formatarMoeda(valTotalItem)}</span>
                            <span class="text-[9px] text-gray-400 block mt-0.5">Total</span>
                        </div>
                    </div>
                </td>
            </tr>`;
        });
    } else {
        // Fallback Legado
        if (document.getElementById('orc-descricao')) document.getElementById('orc-descricao').innerHTML = (orc.servico || 'Sem descrição.').replace(/\n/g, '<br>');

        // Tenta deduzir produtos do total
        const valorTotal = Number(orc.valor) || 0;
        totalProd = valorTotal - totalMO;
    }

    // Atualiza subtotais
    if (document.getElementById('orc-subtotal-produtos')) document.getElementById('orc-subtotal-produtos').innerText = formatarMoeda(totalProd);
    if (document.getElementById('orc-subtotal-mao-obra')) document.getElementById('orc-subtotal-mao-obra').innerText = formatarMoeda(totalMO);
    if (document.getElementById('orc-subtotal-frete')) document.getElementById('orc-subtotal-frete').innerText = formatarMoeda(totalFrete);

    // Carrega dados do cliente
    if (orc.cliente) {
        console.log("=== DEBUG CLIENTE ===");
        console.log("orc.cliente:", orc.cliente);
        console.log("Tipo:", typeof orc.cliente);

        const clienteValue = String(orc.cliente).trim();
        console.log("clienteValue (string):", clienteValue);

        let clienteQuery;

        // Tenta converter para número - se for válido, busca por ID
        const clienteAsNumber = Number(clienteValue);
        const isNumericId = !isNaN(clienteAsNumber) && clienteValue !== '' && Number.isInteger(clienteAsNumber);

        console.log("clienteAsNumber:", clienteAsNumber);
        console.log("isNumericId:", isNumericId);

        if (isNumericId) {
            console.log("Buscando cliente por ID:", clienteAsNumber);
            clienteQuery = sb.from('clientes').select('*').eq('id', clienteAsNumber).maybeSingle();
        } else {
            console.log("Buscando cliente por nome:", clienteValue);
            clienteQuery = sb.from('clientes').select('*').ilike('nome', clienteValue).maybeSingle();
        }

        const { data: cli, error: cliError } = await clienteQuery;

        if (cliError) {
            console.error("❌ Erro ao buscar cliente:", cliError);
        }

        console.log("Resultado da busca:");
        console.log("- data (cli):", cli);
        console.log("- error:", cliError);

        // Vamos listar todos os clientes para debug
        console.log("=== LISTANDO TODOS OS CLIENTES ===");
        const { data: todosClientes, error: errorTodos } = await sb.from('clientes').select('id, nome');
        console.log("Todos os clientes:", todosClientes);
        if (errorTodos) console.error("Erro ao listar todos:", errorTodos);

        if (cli) {
            if (document.getElementById('cli-nome')) {
                document.getElementById('cli-nome').innerText = cli.nome || 'Cliente';
                console.log("✅ Nome preenchido:", cli.nome);
            }
            if (document.getElementById('cli-email')) {
                document.getElementById('cli-email').innerText = cli.email || '-';
                console.log("✅ Email preenchido:", cli.email);
            }
            if (document.getElementById('cli-tel')) {
                document.getElementById('cli-tel').innerText = cli.phone || '-';
                console.log("✅ Telefone preenchido:", cli.phone);
            }
            if (document.getElementById('cli-sub-empresa')) {
                document.getElementById('cli-sub-empresa').innerText = cli.empresa || '-';
                console.log("✅ Empresa preenchida:", cli.empresa);
            }
            if (document.getElementById('cli-cpf')) {
                document.getElementById('cli-cpf').innerText = cli.cpf || '-';
                console.log("✅ NIF preenchido:", cli.cpf);
            }
            if (document.getElementById('cli-endereco')) {
                document.getElementById('cli-endereco').innerText = cli.endereco || '-';
                console.log("✅ Morada preenchida:", cli.endereco);
            }
        } else {
            console.warn("⚠️ Cliente não encontrado no banco de dados");
            if (document.getElementById('cli-nome')) document.getElementById('cli-nome').innerText = clienteValue || 'Cliente';
            if (document.getElementById('cli-email')) document.getElementById('cli-email').innerText = '-';
            if (document.getElementById('cli-tel')) document.getElementById('cli-tel').innerText = '-';
            if (document.getElementById('cli-sub-empresa')) document.getElementById('cli-sub-empresa').innerText = '-';
            if (document.getElementById('cli-cpf')) document.getElementById('cli-cpf').innerText = '-';
            if (document.getElementById('cli-endereco')) document.getElementById('cli-endereco').innerText = '-';
        }
    }

    // Carrega Dados da Empresa do Utilizador
    const { data: empresa } = await sb.from('empresas').select('*').eq('user_id', orc.user_id).maybeSingle();
    if (empresa) {
        if (document.getElementById('empresa-nome')) document.getElementById('empresa-nome').innerText = empresa.nome || 'Sua Empresa';
        if (document.getElementById('empresa-doc')) document.getElementById('empresa-doc').innerText = empresa.doc || '';
        if (document.getElementById('empresa-end')) document.getElementById('empresa-end').innerText = empresa.endereco || '';
        if (document.getElementById('empresa-tel')) document.getElementById('empresa-tel').innerText = empresa.tel || '';
        if (document.getElementById('footer-contact')) document.getElementById('footer-contact').innerText = `Dúvidas? ${empresa.tel || ''}`;

        // Logo
        if (empresa.logo) {
            const logoImg = document.getElementById('empresa-logo-img');
            if (logoImg) {
                logoImg.src = empresa.logo;
                logoImg.classList.remove('hidden');
                // Esconde ícone padrão se tiver logo
                const iconPlaceholder = document.querySelector('.icon-placeholder');
                if (iconPlaceholder) iconPlaceholder.classList.add('hidden');
            }
        }

        // QR Code PIX - Mostra sempre que estiver configurado (não depende do método de pagamento)
        const boxPix = document.getElementById('box-pix');
        const qrContainer = document.getElementById('qr-code-pix-container');
        const qrImg = document.getElementById('qr-code-pix-img');
        const chavePixEl = document.getElementById('orc-chave-pix');

        // LÓGICA DE VISIBILIDADE DO PIX (Atualizada)
        // Só mostra se o método de pagamento selecionado for PIX (ou conter "pix" no nome)
        const isPagamentoPix = (orc.pagamento && orc.pagamento.toLowerCase().includes('pix'));

        // Configura QR Code
        if (empresa.pix_qr && qrContainer && qrImg) {
            qrImg.src = empresa.pix_qr;
        }

        // Decide se mostra o box inteiro
        if (boxPix) {
            if (isPagamentoPix) {
                boxPix.classList.remove('hidden');
                // Garante que o QR code só aparece se configurado
                if (empresa.pix_qr) qrContainer.classList.remove('hidden'); else qrContainer.classList.add('hidden');

                // Preenche chave PIX
                if (chavePixEl) {
                    chavePixEl.innerText = orc.chave_pix || empresa.pix || '---';
                }
            } else {
                boxPix.classList.add('hidden'); // Esconde se não for PIX
            }
        }

        // Preenche observações dinâmicas
        if (document.getElementById('obs-pagamento')) {
            if (orc.pagamento && orc.pagamento !== 'A combinar') {
                document.getElementById('obs-pagamento').classList.remove('hidden');
            }
        }
        if (document.getElementById('obs-prazo') && orc.prazo && orc.prazo !== '0') {
            document.getElementById('obs-prazo').classList.remove('hidden');
            if (document.getElementById('obs-prazo-dias')) {
                document.getElementById('obs-prazo-dias').innerText = orc.prazo;
            }
        }
        if (document.getElementById('obs-validade')) {
            document.getElementById('obs-validade').classList.remove('hidden');
        }

        // Aplicar Cores da Empresa no PDF (usa inline styles para compatibilidade)
        if (empresa.cor_primaria) {
            aplicarCoresPDF(empresa.cor_primaria, empresa.cor_texto);
        }
    }
}

// ===================================
// CONFIGURAÇÕES DA EMPRESA
// ===================================
async function carregarConfiguracoesSupabase() {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;

    const { data: empresa } = await sb.from('empresas').select('*').eq('user_id', user.id).maybeSingle();

    if (empresa) {
        if (document.getElementById('conf-nome')) document.getElementById('conf-nome').value = empresa.nome || '';
        if (document.getElementById('conf-doc')) document.getElementById('conf-doc').value = empresa.doc || '';
        if (document.getElementById('conf-tel')) document.getElementById('conf-tel').value = empresa.tel || '';
        if (document.getElementById('conf-end')) document.getElementById('conf-end').value = empresa.endereco || '';
        if (document.getElementById('conf-pix')) document.getElementById('conf-pix').value = empresa.pix || '';

        // Carrega Cores
        if (empresa.cor_primaria) {
            if (document.getElementById('conf-cor-primaria')) document.getElementById('conf-cor-primaria').value = empresa.cor_primaria;
            if (document.getElementById('conf-cor-primaria-hex')) document.getElementById('conf-cor-primaria-hex').value = empresa.cor_primaria;
        }
        // Nova cor de texto
        if (empresa.cor_texto && document.getElementById('conf-cor-texto')) {
            document.getElementById('conf-cor-texto').value = empresa.cor_texto;
        }
        if (empresa.cor_secundaria) {
            if (document.getElementById('conf-cor-secundaria')) document.getElementById('conf-cor-secundaria').value = empresa.cor_secundaria;
            if (document.getElementById('conf-cor-secundaria-hex')) document.getElementById('conf-cor-secundaria-hex').value = empresa.cor_secundaria;
        }

        // Força Moeda Padrão para EUR
        if (empresa.moeda_padrao !== 'EUR') {
            console.log("Migrando moeda local para EUR...");
        }
        localStorage.setItem('orcafacil_moeda', 'EUR');

        // Carrega Logo e QR Code
        if (empresa.logo) {
            document.getElementById('conf-logo').value = empresa.logo;
            const img = document.getElementById('preview-logo');
            if (img) {
                img.src = empresa.logo;
                img.classList.remove('hidden');
                document.getElementById('preview-logo-placeholder').classList.add('hidden');
            }
        }
        if (empresa.pix_qr) {
            document.getElementById('conf-pix-qr').value = empresa.pix_qr;
            const div = document.getElementById('preview-qr');
            if (div) {
                div.classList.remove('hidden');
                div.querySelector('img').src = empresa.pix_qr;
            }
        }
    }
}

async function salvarConfiguracoesSupabase() {
    const btn = document.querySelector('button[onclick="salvarConfiguracoesSupabase()"]');
    const nome = document.getElementById('conf-nome').value;
    const doc = document.getElementById('conf-doc').value.replace(/\s/g, ''); // Remove espaços
    const tel = document.getElementById('conf-tel').value.replace(/\s/g, ''); // Remove espaços
    const endereco = document.getElementById('conf-end').value;
    const pix = document.getElementById('conf-pix') ? document.getElementById('conf-pix').value : '';
    const logo = document.getElementById('conf-logo').value;
    const pix_qr = document.getElementById('conf-pix-qr') ? document.getElementById('conf-pix-qr').value : '';
    const cor_primaria = document.getElementById('conf-cor-primaria') ? document.getElementById('conf-cor-primaria').value : '#2563eb';
    const cor_secundaria = document.getElementById('conf-cor-secundaria') ? document.getElementById('conf-cor-secundaria').value : '#1e40af';
    const cor_texto = document.getElementById('conf-cor-texto') ? document.getElementById('conf-cor-texto').value : '#ffffff';

    // Força moeda EUR
    const moeda = 'EUR'; // Nome correto da coluna no banco

    if (!nome) return alert("Por favor, informe pelo menos o Nome da Empresa.");

    if (btn) setBtnLoading(btn, true, "Salvando...");

    try {
        const { data: { user } } = await sb.auth.getUser();

        const { data: existente } = await sb.from('empresas').select('id').eq('user_id', user.id).maybeSingle();

        let res;
        const payload = {
            nome,
            doc,
            tel,
            endereco,
            pix,
            logo,
            pix_qr,
            cor_primaria,
            cor_texto,
            moeda
        };

        // Remove cor_secundaria do payload pois não existe mais no HTML
        // Adiciona apenas se o campo existir
        if (cor_secundaria) {
            payload.cor_secundaria = cor_secundaria;
        }

        console.log("Payload a ser salvo:", payload);

        if (existente) {
            res = await sb.from('empresas').update(payload).eq('id', existente.id);
        } else {
            res = await sb.from('empresas').insert([{ ...payload, user_id: user.id }]);
        }

        if (res.error) throw res.error;

        // Atualiza localStorage para formatação global de moeda
        localStorage.setItem('orcafacil_moeda', moeda);

        alert("Configurações da Empresa salvas com sucesso! 🏢");

        // Redireciona para o dashboard
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 500);

    } catch (err) {
        alert("Erro ao guardar: " + err.message);
        console.error(err);
    } finally {
        if (btn) setBtnLoading(btn, false, '<i class="ph-bold ph-check"></i> Guardar');
    }
}

// Aplica cores da empresa no PDF usando estilos inline (compatível com html2pdf)
function aplicarCoresPDF(corPrimaria, corTexto = null) {
    console.log('🎨 Aplicando cores PDF:', corPrimaria, corTexto);

    if (!corPrimaria || corPrimaria === '#000000') {
        console.log('⚠️ Cor primária ignorada:', corPrimaria);
        return; // Ignora se for preto ou vazio
    }

    // Apenas o cabeçalho da tabela recebe a cor
    // Também a linha (borda) abaixo do header
    const headerBar = document.getElementById('pdf-header-bar');
    if (headerBar) {
        headerBar.style.borderColor = corPrimaria;
        console.log('✅ Cor aplicada no header bar');
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
        console.log('✅ Cor aplicada no table header:', ths.length, 'elementos');
    } else {
        console.log('❌ Table header não encontrado');
    }

    // Linha acima dos Termos
    const termsBorder = document.getElementById('pdf-terms-border');
    if (termsBorder) {
        termsBorder.style.borderColor = corPrimaria;
        console.log('✅ Cor aplicada no terms border');
    }
}

// Verifica se a cor é clara (para ajustar texto)
function isLightColor(hexColor) {
    if (!hexColor) return true;
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5;
}

function aplicarTemaEmpresa(primary, secondary) {
    // Ignora se for preto absoluto (erro de configuração anterior ou padrão B&W) para não apagar a UI
    if (!primary && !secondary) return;
    if (primary === '#000000') return;

    const styleId = 'theme-override';
    let style = document.getElementById(styleId);
    if (!style) {
        style = document.createElement('style');
        style.id = styleId;
        document.head.appendChild(style);
    }

    let css = '';
    // Cor Primária: Substitui tons de azul principais e gera tons claros
    if (primary) {
        css += `
            .bg-blue-600 { background-color: ${primary} !important; }
            .text-blue-600 { color: ${primary} !important; }
            .border-blue-600 { border-color: ${primary} !important; }
            
            /* Tons claros derivados da primária (bg-blue-50, text-blue-100/200) */
            .bg-blue-50 { background-color: color-mix(in srgb, ${primary}, white 93%) !important; }
            .text-blue-100 { color: color-mix(in srgb, ${primary}, white 85%) !important; }
            .text-blue-200 { color: color-mix(in srgb, ${primary}, white 70%) !important; }
            
            .focus\\:border-blue-500:focus { border-color: ${primary} !important; }
            .focus\\:ring-blue-500:focus { --tw-ring-color: ${primary} !important; }
            
            .corner-shape { background: linear-gradient(135deg, ${primary} 50%, ${secondary || primary} 50%) !important; }
        `;
    }

    // Cor Secundária: Substitui tons mais escuros (900)
    // Se não houver secundária definida, mantemos o padrão (não forçamos) ou poderíamos gerar um tom escuro.
    if (secondary) {
        css += `
            .bg-blue-900 { background-color: ${secondary} !important; }
            .text-blue-900 { color: ${secondary} !important; }
        `;
    }

    style.innerHTML = css;
}

// ===================================
// GERENCIAMENTO DE API KEYS
// ===================================

async function carregarApiKeys() {
    const container = document.getElementById('lista-api-keys');
    if (!container) return;

    try {
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return;

        const { data: keys, error } = await sb.from('api_keys').select('*').eq('user_id', user.id).order('created_at', { ascending: false });

        if (error) throw error;

        if (!keys || keys.length === 0) {
            container.innerHTML = `
                <div class="p-8 text-center text-slate-400">
                    <i class="ph-duotone ph-key text-4xl mb-2 opacity-50"></i>
                    <p class="text-sm font-medium">Nenhuma API Key gerada</p>
                    <p class="text-xs mt-1">Gere sua primeira chave para começar a integrar.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = keys.map(key => `
            <div class="p-4 flex items-center justify-between gap-4 bg-white hover:bg-slate-50 transition-colors">
                <div class="flex-1 min-w-0">
                    <p class="font-bold text-slate-800 text-sm">${key.name || 'API Key'}</p>
                    <p class="text-xs text-slate-500 font-mono truncate">${key.key.substring(0, 20)}...${key.key.slice(-8)}</p>
                    <p class="text-[10px] text-slate-400 mt-1">
                        Criada em ${formatarData(key.created_at)}
                        ${key.last_used_at ? ` • Último uso: ${formatarData(key.last_used_at)}` : ''}
                    </p>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="copiarApiKey('${key.key}')" 
                        class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Copiar chave">
                        <i class="ph-bold ph-copy"></i>
                    </button>
                    <button onclick="revogarApiKey('${key.id}')" 
                        class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Revogar chave">
                        <i class="ph-bold ph-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

    } catch (e) {
        console.error("Erro ao carregar API Keys:", e);
        container.innerHTML = `<div class="p-4 text-center text-red-500 text-sm">Erro ao carregar chaves</div>`;
    }
}

async function gerarNovaApiKey() {
    const nome = prompt("Nome da API Key (opcional):", "Integração Principal");
    if (nome === null) return; // Cancelou

    try {
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return alert("Faça login novamente.");

        // Gera chave única
        const key = 'orcafacil_' + Array.from(crypto.getRandomValues(new Uint8Array(24)))
            .map(b => b.toString(16).padStart(2, '0')).join('');

        const { data, error } = await sb.from('api_keys').insert([{
            user_id: user.id,
            key: key,
            name: nome || 'API Key'
        }]).select().single();

        if (error) throw error;

        // Mostra a chave para o utilizador copiar
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-scale-in">
                <div class="text-center mb-4">
                    <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <i class="ph-bold ph-check-circle text-green-600 text-3xl"></i>
                    </div>
                    <h3 class="text-lg font-bold text-slate-900">API Key Gerada!</h3>
                    <p class="text-sm text-slate-500 mt-1">Copie e guarde em local seguro. Não será exibida novamente.</p>
                </div>
                <div class="bg-slate-100 p-4 rounded-lg mb-4">
                    <p class="text-xs font-mono text-slate-700 break-all select-all">${key}</p>
                </div>
                <div class="flex gap-3">
                    <button onclick="copiarApiKey('${key}'); this.innerHTML='<i class=\\'ph-bold ph-check\\'></i> Copiado!';" 
                        class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2">
                        <i class="ph-bold ph-copy"></i> Copiar Chave
                    </button>
                    <button onclick="this.closest('.fixed').remove()" 
                        class="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-all">
                        Fechar
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        carregarApiKeys();

    } catch (e) {
        console.error("Erro ao gerar API Key:", e);
        alert("Erro ao gerar chave: " + e.message);
    }
}

function copiarApiKey(key) {
    navigator.clipboard.writeText(key).then(() => {
        // Feedback visual temporário
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg z-[100] animate-fade-in';
        toast.innerHTML = '<i class="ph-bold ph-check mr-2"></i> Chave copiada!';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }).catch(e => {
        alert("Erro ao copiar. Selecione manualmente.");
    });
}

async function revogarApiKey(id) {
    if (!confirm("Tem certeza? Sistemas usando esta chave perderão acesso imediatamente.")) return;

    try {
        const { error } = await sb.from('api_keys').delete().eq('id', id);
        if (error) throw error;
        carregarApiKeys();
    } catch (e) {
        console.error("Erro ao revogar API Key:", e);
        alert("Erro ao revogar chave.");
    }
}

function mostrarDocApi() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 overflow-y-auto';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    modal.innerHTML = `
        <div class="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <i class="ph-duotone ph-book-open text-blue-600"></i> Documentação da API
                </h3>
                <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg">
                    <i class="ph-bold ph-x text-lg"></i>
                </button>
            </div>
            
            <div class="space-y-6 text-sm">
                <div>
                    <h4 class="font-bold text-slate-800 mb-2">🔐 Autenticação</h4>
                    <p class="text-slate-600 mb-2">Todas as requisições devem incluir o header Authorization:</p>
                    <code class="block bg-slate-100 p-3 rounded-lg text-xs font-mono">Authorization: Bearer SUA_API_KEY</code>
                </div>

                <div>
                    <h4 class="font-bold text-slate-800 mb-2">📋 Orçamentos</h4>
                    <table class="w-full text-xs border-collapse">
                        <thead class="bg-slate-100">
                            <tr><th class="p-2 text-left">Método</th><th class="p-2 text-left">Endpoint</th><th class="p-2 text-left">Descrição</th></tr>
                        </thead>
                        <tbody class="divide-y">
                            <tr><td class="p-2 font-mono text-green-600">GET</td><td class="p-2">/api/orcamentos</td><td class="p-2">Lista todos</td></tr>
                            <tr><td class="p-2 font-mono text-green-600">GET</td><td class="p-2">/api/orcamentos/:id</td><td class="p-2">Busca por ID</td></tr>
                            <tr><td class="p-2 font-mono text-blue-600">POST</td><td class="p-2">/api/orcamentos</td><td class="p-2">Cria novo</td></tr>
                            <tr><td class="p-2 font-mono text-yellow-600">PUT</td><td class="p-2">/api/orcamentos/:id</td><td class="p-2">Atualiza</td></tr>
                            <tr><td class="p-2 font-mono text-red-600">DELETE</td><td class="p-2">/api/orcamentos/:id</td><td class="p-2">Remove</td></tr>
                        </tbody>
                    </table>
                </div>

                <div>
                    <h4 class="font-bold text-slate-800 mb-2">👥 Clientes</h4>
                    <p class="text-slate-500 text-xs">Mesmos métodos: GET, POST, PUT, DELETE em <code>/api/clientes</code></p>
                </div>

                <div>
                    <h4 class="font-bold text-slate-800 mb-2">📦 Itens/Catálogo</h4>
                    <p class="text-slate-500 text-xs">Mesmos métodos: GET, POST, PUT, DELETE em <code>/api/itens</code></p>
                </div>

                <div>
                    <h4 class="font-bold text-slate-800 mb-2">🏢 Empresa</h4>
                    <p class="text-slate-500 text-xs">GET e PUT disponíveis em <code>/api/empresa</code></p>
                </div>

                <div class="pt-4 border-t">
                    <h4 class="font-bold text-slate-800 mb-2">📝 Exemplo - Criar Orçamento</h4>
                    <pre class="bg-slate-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto">
curl -X POST "https://hjeqxocuuquosfapibxo.supabase.co/functions/v1/api/orcamentos" \\
  -H "Authorization: Bearer SUA_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "cliente": "João Silva",
    "valor": 1500.00,
    "servico": "Instalação elétrica",
    "prazo": "15",
    "pagamento": "pix"
  }'</pre>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// ===================================
// CONVERSÃO DE IMAGEM PARA BASE64
// ===================================

function converterImagemBase64(input, targetId) {
    const file = input.files[0];
    if (!file) return;

    // Valida tipo de arquivo
    if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas arquivos de imagem.');
        input.value = '';
        return;
    }

    // Valida tamanho (máx 2MB)
    if (file.size > 2 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 2MB.');
        input.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const img = new Image();
        img.onload = function () {
            // Comprime a imagem usando canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Define tamanho máximo (mantém proporção)
            const maxWidth = 800;
            const maxHeight = 800;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width *= maxHeight / height;
                    height = maxHeight;
                }
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            // Converte para Base64 (PNG para preservar transparência)
            const base64 = canvas.toDataURL('image/png');

            // Atualiza o input hidden com a base64
            const hiddenInput = document.getElementById(targetId);
            if (hiddenInput) {
                hiddenInput.value = base64;
            }

            // Atualiza preview se for logo
            if (targetId === 'conf-logo') {
                const preview = document.getElementById('preview-logo');
                const placeholder = document.getElementById('preview-logo-placeholder');
                if (preview && placeholder) {
                    preview.src = base64;
                    preview.classList.remove('hidden');
                    placeholder.classList.add('hidden');
                }
            }

            // Atualiza preview se for QR Code
            if (targetId === 'conf-pix-qr') {
                const preview = document.getElementById('preview-qr');
                const btnText = document.getElementById('btn-qr-text');
                if (preview) {
                    const img = preview.querySelector('img');
                    if (img) {
                        img.src = base64;
                        preview.classList.remove('hidden');
                    }
                }
                if (btnText) {
                    btnText.innerText = 'QR Code Selecionado ✓';
                }
            }
        };

        img.onerror = function () {
            alert('Erro ao processar a imagem. Tente outro arquivo.');
            input.value = '';
        };

        img.src = e.target.result;
    };

    reader.onerror = function () {
        alert('Erro ao ler o arquivo. Tente novamente.');
        input.value = '';
    };

    reader.readAsDataURL(file);
}

// Carrega API Keys ao abrir a página de configurações
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('lista-api-keys')) {
        setTimeout(carregarApiKeys, 500); // Delay para garantir que sb está pronto
    }
});



// Inicializador
document.addEventListener('DOMContentLoaded', () => {
    // Inicialização condicional baseada na página
    if (document.getElementById('select-cliente')) carregarSelectClientes();
    if (document.getElementById('lista-clientes')) carregarListaClientes();
    if (document.getElementById('tabela-catalogo')) carregarCatalogo();
    if (document.getElementById('tabela-completa')) carregarPaginaOrcamentos();
    if (document.getElementById('kpi-total')) atualizarKPIs();

    // Auth check state change
    sb.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') window.location.href = 'index.html';
    });
});

async function carregarSelectClientes() {
    const sel = document.getElementById('select-cliente');
    if (!sel) return;

    try {
        const { data: clientes, error } = await sb.from('clientes').select('id, nome, empresa').order('nome');
        if (error) throw error;

        sel.innerHTML = '<option value="">Selecione um cliente...</option>';
        if (clientes) {
            clientes.forEach(cli => {
                const opt = document.createElement('option');
                opt.value = cli.nome; // Usando Nome como valor para o Orçamento (conforme lógica do projeto)
                opt.innerText = cli.empresa ? `${cli.nome} (${cli.empresa})` : cli.nome;
                opt.setAttribute('data-id', cli.id); // Guarda ID se precisar
                sel.appendChild(opt);
            });
        }
    } catch (e) {
        console.error("Erro ao carregar select clientes:", e);
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

        // Esconde formulário
        toggleNovoCliente();

        // Atualiza o select de clientes e seleciona o novo
        if (typeof carregarSelectClientes === 'function') await carregarSelectClientes();

        // Seleciona o recém criado
        const select = document.getElementById('select-cliente');
        if (select) {
            select.value = data[0].nome; // Define o valor pelo NOME
            select.dispatchEvent(new Event('change'));
        }

    } catch (err) {
        console.error(err);
        alert("Erro ao guardar cliente: " + err.message);
    }
}