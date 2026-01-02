// ============================================================================
// SIRIUS WEB - Módulo de Clientes
// Arquivo: clientes.js
// ============================================================================

// Configuração Supabase
const SUPABASE_URL = 'https://lutwlisdkciaslvqauyh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1dHdsaXNka2NpYXNsdnFhdXloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4ODgxODYsImV4cCI6MjA4MjQ2NDE4Nn0.CYAhmx4HxXjE6yBIIascPb0Y4siG-oUsGUfWP83am6Q';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================================================
// VARIÁVEIS GLOBAIS
// ============================================================================
let modoEdicao = false;
let filtroAtual = null;
let clientesFiltrados = [];
let telefones = [];
let confirmCallback = null;

const ITENS_POR_PAGINA = 15;
let paginaAtual = 1;
let totalPaginas = 1;

// ============================================================================
// INICIALIZAÇÃO
// ============================================================================
window.addEventListener('DOMContentLoaded', function() {
    carregarClientes();
    inicializarEventos();
});

function inicializarEventos() {
    // Botões principais
    document.getElementById('btnAdicionar').addEventListener('click', abrirModalAdicionar);
    document.getElementById('btnFechar').addEventListener('click', fecharModal);
    document.getElementById('btnFecharFiltro').addEventListener('click', fecharModalFiltro);
    document.getElementById('formCliente').addEventListener('submit', salvarCliente);
    document.getElementById('formFiltro').addEventListener('submit', aplicarFiltro);
    document.getElementById('btnLimparFiltro').addEventListener('click', limparFiltro);
    document.getElementById('relatorioFiltro').addEventListener('click', (e) => { e.preventDefault(); gerarRelatorioFiltro(); });
    document.getElementById('btnAddTelefone').addEventListener('click', adicionarTelefone);
    document.getElementById('btnConfirmNo').addEventListener('click', fecharConfirm);
    document.getElementById('alertBtn').addEventListener('click', fecharAlerta);
    
    // Filtros
    document.getElementById('filtroId').addEventListener('click', (e) => { e.preventDefault(); abrirModalFiltro('id'); });
    document.getElementById('filtroRazao').addEventListener('click', (e) => { e.preventDefault(); abrirModalFiltro('razao'); });
    document.getElementById('filtroPessoa').addEventListener('click', (e) => { e.preventDefault(); abrirModalFiltro('pessoa'); });
    document.getElementById('filtroCnpj').addEventListener('click', (e) => { e.preventDefault(); abrirModalFiltro('cnpj'); });
    document.getElementById('filtroSituacao').addEventListener('click', (e) => { e.preventDefault(); abrirModalFiltro('situacao'); });
    
    // Formatação de campos
    document.getElementById('cnpj').addEventListener('input', formatarCNPJ);
    document.getElementById('end_cep').addEventListener('input', formatarCEP);
    document.getElementById('end_cobranca_cep').addEventListener('input', formatarCEP);
    document.getElementById('end_entrega_cep').addEventListener('input', formatarCEP);
    document.getElementById('end_uf').addEventListener('input', (e) => { e.target.value = e.target.value.toUpperCase(); });
    document.getElementById('end_cobranca_uf').addEventListener('input', (e) => { e.target.value = e.target.value.toUpperCase(); });
    document.getElementById('end_entrega_uf').addEventListener('input', (e) => { e.target.value = e.target.value.toUpperCase(); });
    document.getElementById('email').addEventListener('input', (e) => { e.target.value = e.target.value.toLowerCase(); });
    
    // Paginação
    document.getElementById('btnPrimeira').addEventListener('click', irParaPrimeiraPagina);
    document.getElementById('btnAnterior').addEventListener('click', irParaPaginaAnterior);
    document.getElementById('btnProxima').addEventListener('click', irParaProximaPagina);
    document.getElementById('btnUltima').addEventListener('click', irParaUltimaPagina);
    
    // Abas
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => mudarAba(parseInt(tab.dataset.tab)));
    });
    
    // Fechar modais clicando fora
    window.addEventListener('click', function(event) {
        if (event.target.id === 'modal') fecharModal();
        if (event.target.id === 'modalFiltro') fecharModalFiltro();
    });
}

// ============================================================================
// FUNÇÕES DE ABAS
// ============================================================================
function mudarAba(index) {
    document.querySelectorAll('.tab').forEach((tab, i) => {
        tab.classList.toggle('active', i === index);
    });
    
    document.querySelectorAll('.tab-content').forEach((content, i) => {
        content.classList.toggle('active', i === index);
    });
}

// ============================================================================
// SISTEMA DE ALERTAS CENTRALIZADO
// ============================================================================
function mostrarAlerta(mensagem, tipo = 'success') {
    const overlay = document.getElementById('alertOverlay');
    const box = document.getElementById('alertBox');
    const icon = document.getElementById('alertIcon');
    const message = document.getElementById('alertMessage');
    
    // Configurar ícone e estilo
    if (tipo === 'success') {
        icon.textContent = '✅';
        icon.className = 'alert-icon success';
        box.className = 'alert-box success';
    } else {
        icon.textContent = '❌';
        icon.className = 'alert-icon error';
        box.className = 'alert-box error';
    }
    
    message.textContent = mensagem;
    overlay.style.display = 'block';
}

function fecharAlerta() {
    document.getElementById('alertOverlay').style.display = 'none';
}

// ============================================================================
// FUNÇÕES DE TELEFONE
// ============================================================================
function adicionarTelefone() {
    telefones.push({ tipo: 'Comercial', numero: '' });
    renderizarTelefones();
}

function removerTelefone(index) {
    telefones.splice(index, 1);
    renderizarTelefones();
}

function renderizarTelefones() {
    const container = document.getElementById('telefones-list');
    container.innerHTML = '';
    
    telefones.forEach((tel, index) => {
        const div = document.createElement('div');
        div.className = 'telefones-item';
        div.innerHTML = `
            <select onchange="telefones[${index}].tipo = this.value">
                <option value="Comercial" ${tel.tipo === 'Comercial' ? 'selected' : ''}>📞 Comercial</option>
                <option value="Celular" ${tel.tipo === 'Celular' ? 'selected' : ''}>📱 Celular</option>
                <option value="WhatsApp" ${tel.tipo === 'WhatsApp' ? 'selected' : ''}>💬 WhatsApp</option>
            </select>
            <input type="text" value="${tel.numero}" 
                   onchange="telefones[${index}].numero = this.value"
                   oninput="formatarTelefoneInput(this)"
                   placeholder="(00) 00000-0000">
            <button type="button" class="btn-remove" onclick="removerTelefone(${index})">✖</button>
        `;
        container.appendChild(div);
    });
}

function formatarTelefoneInput(input) {
    let valor = input.value.replace(/\D/g, '');
    
    if (valor.length <= 10) {
        valor = valor.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    } else {
        valor = valor.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
    }
    
    input.value = valor;
}

// ============================================================================
// FUNÇÕES DE FORMATAÇÃO
// ============================================================================
function formatarCNPJ(e) {
    let valor = e.target.value.replace(/[^0-9A-Za-z]/g, '');
    valor = valor.toUpperCase().substring(0, 14);
    
    if (valor.length <= 14) {
        valor = valor.replace(/(\w{2})(\w{3})(\w{3})(\w{4})(\w{0,2})/, '$1.$2.$3/$4-$5');
    }
    
    e.target.value = valor;
}

function formatarCEP(e) {
    let valor = e.target.value.replace(/\D/g, '');
    valor = valor.substring(0, 8);
    
    if (valor.length > 5) {
        valor = valor.replace(/(\d{5})(\d{0,3})/, '$1-$2');
    }
    
    e.target.value = valor;
}

function formatarCNPJExibicao(cnpj) {
    if (!cnpj) return '-';
    const limpo = cnpj.replace(/[^0-9A-Za-z]/g, '');
    if (limpo.length < 14) return cnpj;
    return limpo.replace(/(\w{2})(\w{3})(\w{3})(\w{4})(\w{2})/, '$1.$2.$3/$4-$5');
}

// ============================================================================
// FUNÇÕES DE CRUD
// ============================================================================
async function carregarClientes() {
    document.getElementById('loading').style.display = 'block';
    
    try {
        const { data, error } = await sb
            .from('clientes')
            .select('*')
            .order('id', { ascending: true });

        if (error) throw error;

        clientesFiltrados = data;
        paginaAtual = 1;
        calcularTotalPaginas();
        exibirPaginaAtual();
    } catch (error) {
        mostrarAlerta('Erro ao carregar clientes: ' + error.message, 'error');
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

function calcularTotalPaginas() {
    totalPaginas = Math.ceil(clientesFiltrados.length / ITENS_POR_PAGINA);
    if (totalPaginas === 0) totalPaginas = 1;
    document.getElementById('totalPaginas').textContent = totalPaginas;
}

function exibirPaginaAtual() {
    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
    const fim = inicio + ITENS_POR_PAGINA;
    const clientesPagina = clientesFiltrados.slice(inicio, fim);
    
    exibirClientes(clientesPagina);
    atualizarBotoesPaginacao();
    document.getElementById('paginaAtual').textContent = paginaAtual;
}

function atualizarBotoesPaginacao() {
    document.getElementById('btnPrimeira').disabled = paginaAtual === 1;
    document.getElementById('btnAnterior').disabled = paginaAtual === 1;
    document.getElementById('btnProxima').disabled = paginaAtual === totalPaginas;
    document.getElementById('btnUltima').disabled = paginaAtual === totalPaginas;
}

function irParaPrimeiraPagina() {
    paginaAtual = 1;
    exibirPaginaAtual();
}

function irParaPaginaAnterior() {
    if (paginaAtual > 1) {
        paginaAtual--;
        exibirPaginaAtual();
    }
}

function irParaProximaPagina() {
    if (paginaAtual < totalPaginas) {
        paginaAtual++;
        exibirPaginaAtual();
    }
}

function irParaUltimaPagina() {
    paginaAtual = totalPaginas;
    exibirPaginaAtual();
}

function exibirClientes(clientes) {
    const tbody = document.getElementById('corpoTabela');
    tbody.innerHTML = '';

    if (clientes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #999;">Nenhum cliente encontrado</td></tr>';
        return;
    }

    clientes.forEach(cliente => {
        const tr = document.createElement('tr');
        
        const situacaoTexto = cliente.situacao === 'A' ? '✅ Ativo' : '❌ Inativo';
        const cidadeUF = `${cliente.end_cidade || '-'} / ${cliente.end_uf || '-'}`;
        
        tr.innerHTML = `
            <td>${cliente.id}</td>
            <td>${cliente.razao_social}</td>
            <td>${formatarCNPJExibicao(cliente.cnpj)}</td>
            <td>${cidadeUF}</td>
            <td>${situacaoTexto}</td>
            <td class="actions">
                <button class="btn btn-small btn-edit" onclick="editarCliente(${cliente.id})">✏️ Editar</button>
                <button class="btn btn-small btn-delete" onclick="confirmarExclusao(${cliente.id})">🗑️ Excluir</button>
                <button class="btn btn-small" onclick="gerarRelatorioIndividual(${cliente.id})">📄 Relatório</button>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
}

async function abrirModalAdicionar() {
    modoEdicao = false;
    document.getElementById('modalTitulo').textContent = 'Adicionar Cliente';
    document.getElementById('formCliente').reset();
    document.getElementById('clienteId').value = '';
    telefones = [];
    renderizarTelefones();
    mudarAba(0);
    
    try {
        const { data, error } = await sb
            .from('clientes')
            .select('id')
            .order('id', { ascending: false })
            .limit(1);

        if (error) throw error;

        const proximoId = data && data.length > 0 ? data[0].id + 1 : 1;
        document.getElementById('id').value = proximoId;
        document.getElementById('id').readOnly = true;
    } catch (error) {
        mostrarAlerta('Erro ao gerar próximo ID: ' + error.message, 'error');
    }

    document.getElementById('modal').style.display = 'block';
    setTimeout(() => {
        document.getElementById('razao_social').focus();
    }, 100);
}

async function editarCliente(id) {
    modoEdicao = true;
    document.getElementById('modalTitulo').textContent = 'Editar Cliente';
    
    try {
        const { data, error } = await sb
            .from('clientes')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        document.getElementById('clienteId').value = data.id;
        document.getElementById('id').value = data.id;
        document.getElementById('id').readOnly = true;
        document.getElementById('razao_social').value = data.razao_social || '';
        document.getElementById('pessoa_p_contato').value = data.pessoa_p_contato || '';
        document.getElementById('cnpj').value = formatarCNPJExibicao(data.cnpj);
        document.getElementById('insc_estadual').value = data.insc_estadual || '';
        document.getElementById('situacao').value = data.situacao;
        
        // Endereço Principal
        document.getElementById('end_tipo_logradouro').value = data.end_tipo_logradouro || '';
        document.getElementById('end_logradouro').value = data.end_logradouro || '';
        document.getElementById('end_numero').value = data.end_numero || '';
        document.getElementById('end_andar').value = data.end_andar || '';
        document.getElementById('end_complemento').value = data.end_complemento || '';
        document.getElementById('end_bairro').value = data.end_bairro || '';
        document.getElementById('end_cep').value = data.end_cep || '';
        document.getElementById('end_cidade').value = data.end_cidade || '';
        document.getElementById('end_uf').value = data.end_uf || '';
        document.getElementById('codigo_municipio').value = data.codigo_municipio || '';
        
        // Endereço Cobrança
        document.getElementById('end_cobranca_tipo_logradouro').value = data.end_cobranca_tipo_logradouro || '';
        document.getElementById('end_cobranca_logradouro').value = data.end_cobranca_logradouro || '';
        document.getElementById('end_cobranca_numero').value = data.end_cobranca_numero || '';
        document.getElementById('end_cobranca_andar').value = data.end_cobranca_andar || '';
        document.getElementById('end_cobranca_complemento').value = data.end_cobranca_complemento || '';
        document.getElementById('end_cobranca_bairro').value = data.end_cobranca_bairro || '';
        document.getElementById('end_cobranca_cep').value = data.end_cobranca_cep || '';
        document.getElementById('end_cobranca_cidade').value = data.end_cobranca_cidade || '';
        document.getElementById('end_cobranca_uf').value = data.end_cobranca_uf || '';
        
        // Endereço Entrega
        document.getElementById('end_entrega_tipo_logradouro').value = data.end_entrega_tipo_logradouro || '';
        document.getElementById('end_entrega_logradouro').value = data.end_entrega_logradouro || '';
        document.getElementById('end_entrega_numero').value = data.end_entrega_numero || '';
        document.getElementById('end_entrega_andar').value = data.end_entrega_andar || '';
        document.getElementById('end_entrega_complemento').value = data.end_entrega_complemento || '';
        document.getElementById('end_entrega_bairro').value = data.end_entrega_bairro || '';
        document.getElementById('end_entrega_cep').value = data.end_entrega_cep || '';
        document.getElementById('end_entrega_cidade').value = data.end_entrega_cidade || '';
        document.getElementById('end_entrega_uf').value = data.end_entrega_uf || '';
        
        // Contatos
        document.getElementById('email').value = data.email || '';
        document.getElementById('site').value = data.site || '';
        telefones = data.telefone || [];
        renderizarTelefones();
        
        // Observações
        document.getElementById('obs').value = data.obs || '';
        
        mudarAba(0);
        document.getElementById('modal').style.display = 'block';
    } catch (error) {
        mostrarAlerta('Erro ao carregar cliente: ' + error.message, 'error');
    }
}

async function salvarCliente(e) {
    e.preventDefault();
    
    const cnpjLimpo = document.getElementById('cnpj').value.replace(/[^0-9A-Za-z]/g, '');
    
    if (cnpjLimpo.length !== 14) {
        mostrarAlerta('CNPJ deve ter exatamente 14 caracteres!', 'error');
        mudarAba(0);
        document.getElementById('cnpj').focus();
        return;
    }
    
    const cliente = {
        razao_social: document.getElementById('razao_social').value,
        pessoa_p_contato: document.getElementById('pessoa_p_contato').value || null,
        cnpj: cnpjLimpo,
        insc_estadual: document.getElementById('insc_estadual').value || null,
        end_tipo_logradouro: document.getElementById('end_tipo_logradouro').value || null,
        end_logradouro: document.getElementById('end_logradouro').value || null,
        end_numero: document.getElementById('end_numero').value || null,
        end_andar: document.getElementById('end_andar').value || null,
        end_complemento: document.getElementById('end_complemento').value || null,
        end_bairro: document.getElementById('end_bairro').value || null,
        end_cep: document.getElementById('end_cep').value || null,
        codigo_municipio: document.getElementById('codigo_municipio').value || null,
        end_cidade: document.getElementById('end_cidade').value || null,
        end_uf: document.getElementById('end_uf').value || null,
        end_cobranca_tipo_logradouro: document.getElementById('end_cobranca_tipo_logradouro').value || null,
        end_cobranca_logradouro: document.getElementById('end_cobranca_logradouro').value || null,
        end_cobranca_numero: document.getElementById('end_cobranca_numero').value || null,
        end_cobranca_andar: document.getElementById('end_cobranca_andar').value || null,
        end_cobranca_complemento: document.getElementById('end_cobranca_complemento').value || null,
        end_cobranca_bairro: document.getElementById('end_cobranca_bairro').value || null,
        end_cobranca_cep: document.getElementById('end_cobranca_cep').value || null,
        end_cobranca_cidade: document.getElementById('end_cobranca_cidade').value || null,
        end_cobranca_uf: document.getElementById('end_cobranca_uf').value || null,
        end_entrega_tipo_logradouro: document.getElementById('end_entrega_tipo_logradouro').value || null,
        end_entrega_logradouro: document.getElementById('end_entrega_logradouro').value || null,
        end_entrega_numero: document.getElementById('end_entrega_numero').value || null,
        end_entrega_andar: document.getElementById('end_entrega_andar').value || null,
        end_entrega_complemento: document.getElementById('end_entrega_complemento').value || null,
        end_entrega_bairro: document.getElementById('end_entrega_bairro').value || null,
        end_entrega_cep: document.getElementById('end_entrega_cep').value || null,
        end_entrega_cidade: document.getElementById('end_entrega_cidade').value || null,
        end_entrega_uf: document.getElementById('end_entrega_uf').value || null,
        telefone: telefones,
        email: document.getElementById('email').value || null,
        site: document.getElementById('site').value || null,
        situacao: document.getElementById('situacao').value,
        obs: document.getElementById('obs').value || null
    };

    try {
        if (modoEdicao) {
            const id = document.getElementById('clienteId').value;
            const { error } = await sb
                .from('clientes')
                .update(cliente)
                .eq('id', id);

            if (error) throw error;
            mostrarAlerta('Cliente atualizado com sucesso!', 'success');
        } else {
            cliente.id = parseInt(document.getElementById('id').value);
            const { error } = await sb
                .from('clientes')
                .insert([cliente]);

            if (error) throw error;
            mostrarAlerta('Cliente cadastrado com sucesso!', 'success');
        }

        fecharModal();
        carregarClientes();
    } catch (error) {
        if (error.code === '23505') {
            mostrarAlerta('Este CNPJ já está cadastrado!', 'error');
            mudarAba(0);
            document.getElementById('cnpj').focus();
        } else {
            mostrarAlerta('Erro ao salvar cliente: ' + error.message, 'error');
        }
    }
}

function confirmarExclusao(id) {
    mostrarConfirm(
        `Deseja realmente excluir o cliente ${id}?`,
        () => excluirCliente(id)
    );
}

async function excluirCliente(id) {
    try {
        const { error } = await sb
            .from('clientes')
            .delete()
            .eq('id', id);

        if (error) throw error;

        mostrarAlerta('Cliente excluído com sucesso!', 'success');
        carregarClientes();
    } catch (error) {
        mostrarAlerta('Erro ao excluir cliente: ' + error.message, 'error');
    }
}

// ============================================================================
// FUNÇÕES DE FILTRO
// ============================================================================
function abrirModalFiltro(tipo) {
    filtroAtual = { tipo };
    const titulo = document.getElementById('tituloFiltro');
    const campo = document.getElementById('campoFiltro');

    switch(tipo) {
        case 'id':
            titulo.textContent = 'Filtrar por ID';
            campo.innerHTML = '<label for="filtro_id">ID:</label><input type="number" id="filtro_id" required>';
            break;
        case 'razao':
            titulo.textContent = 'Filtrar por Razão Social';
            campo.innerHTML = '<label for="filtro_razao">Razão Social:</label><input type="text" id="filtro_razao" required>';
            break;
        case 'pessoa':
            titulo.textContent = 'Filtrar por Pessoa para Contato';
            campo.innerHTML = '<label for="filtro_pessoa">Pessoa para Contato:</label><input type="text" id="filtro_pessoa" required>';
            break;
        case 'cnpj':
            titulo.textContent = 'Filtrar por CNPJ';
            campo.innerHTML = '<label for="filtro_cnpj">CNPJ:</label><input type="text" id="filtro_cnpj" maxlength="18" required>';
            document.getElementById('filtro_cnpj').addEventListener('input', formatarCNPJ);
            break;
        case 'situacao':
            titulo.textContent = 'Filtrar por Situação';
            campo.innerHTML = `
                <label for="filtro_situacao">Situação:</label>
                <select id="filtro_situacao" required>
                    <option value="A">Ativo</option>
                    <option value="I">Inativo</option>
                </select>
            `;
            break;
    }

    document.getElementById('modalFiltro').style.display = 'block';
    setTimeout(() => campo.querySelector('input, select').focus(), 100);
}

async function aplicarFiltro(e) {
    e.preventDefault();
    
    let query = sb.from('clientes').select('*');
    let textoFiltro = '';
    
    try {
        switch(filtroAtual.tipo) {
            case 'id':
                const id = parseInt(document.getElementById('filtro_id').value);
                query = query.eq('id', id);
                textoFiltro = `ID = ${id}`;
                break;
            case 'razao':
                const razao = document.getElementById('filtro_razao').value;
                query = query.ilike('razao_social', `%${razao}%`);
                textoFiltro = `Razão Social contém "${razao}"`;
                break;
            case 'pessoa':
                const pessoa = document.getElementById('filtro_pessoa').value;
                query = query.ilike('pessoa_p_contato', `%${pessoa}%`);
                textoFiltro = `Pessoa Contato contém "${pessoa}"`;
                break;
            case 'cnpj':
                const cnpj = document.getElementById('filtro_cnpj').value.replace(/[^0-9A-Za-z]/g, '');
                query = query.eq('cnpj', cnpj);
                textoFiltro = `CNPJ = ${formatarCNPJExibicao(cnpj)}`;
                break;
            case 'situacao':
                const situacao = document.getElementById('filtro_situacao').value;
                query = query.eq('situacao', situacao);
                textoFiltro = `Situação = ${situacao === 'A' ? 'Ativo' : 'Inativo'}`;
                break;
        }

        const { data, error } = await query.order('id', { ascending: true });
        
        if (error) throw error;

        clientesFiltrados = data;
        paginaAtual = 1;
        calcularTotalPaginas();
        exibirPaginaAtual();
        mostrarFiltroAtivo(textoFiltro);
        fecharModalFiltro();
    } catch (error) {
        mostrarAlerta('Erro ao aplicar filtro: ' + error.message, 'error');
    }
}

function mostrarFiltroAtivo(texto) {
    document.getElementById('textoFiltro').textContent = texto;
    document.getElementById('filtroAtivo').style.display = 'block';
}

function limparFiltro() {
    document.getElementById('filtroAtivo').style.display = 'none';
    filtroAtual = null;
    carregarClientes();
}

// ============================================================================
// FUNÇÕES DE RELATÓRIO
// ============================================================================
async function gerarRelatorioIndividual(id) {
    try {
        const { data, error } = await sb
            .from('clientes')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        const telefonesHTML = (data.telefone || []).map(t => 
            `<tr><td colspan="2"><strong>${t.tipo}:</strong> ${t.numero}</td></tr>`
        ).join('');

        let html = `
            <html>
            <head>
                <title>SIRIUS WEB - Cliente ${data.id}</title>
                <style>
                    body { font-family: Arial; padding: 40px; max-width: 800px; margin: 0 auto; }
                    h1 { color: #667eea; border-bottom: 3px solid #667eea; padding-bottom: 10px; }
                    .subtitle { color: #999; margin-bottom: 30px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    td { padding: 8px; border-bottom: 1px solid #eee; }
                    td:first-child { font-weight: bold; width: 200px; color: #666; }
                    .section { margin-top: 30px; font-size: 1.2em; color: #667eea; font-weight: bold; border-bottom: 2px solid #eee; padding-bottom: 5px; }
                </style>
            </head>
            <body>
                <h1>🏢 SIRIUS WEB</h1>
                <div class="subtitle">Relatório Detalhado de Cliente</div>
                
                <div class="section">Dados Principais</div>
                <table>
                    <tr><td>ID</td><td>${data.id}</td></tr>
                    <tr><td>Razão Social</td><td>${data.razao_social}</td></tr>
                    <tr><td>CNPJ</td><td>${formatarCNPJExibicao(data.cnpj)}</td></tr>
                    <tr><td>Inscrição Estadual</td><td>${data.insc_estadual || '-'}</td></tr>
                    <tr><td>Pessoa para Contato</td><td>${data.pessoa_p_contato || '-'}</td></tr>
                    <tr><td>Situação</td><td>${data.situacao === 'A' ? 'Ativo' : 'Inativo'}</td></tr>
                </table>
                
                <div class="section">Endereço Principal</div>
                <table>
                    <tr><td>Tipo Logradouro</td><td>${data.end_tipo_logradouro || '-'}</td></tr>
                    <tr><td>Logradouro</td><td>${data.end_logradouro || '-'}</td></tr>
                    <tr><td>Número</td><td>${data.end_numero || '-'}</td></tr>
                    <tr><td>Andar</td><td>${data.end_andar || '-'}</td></tr>
                    <tr><td>Complemento</td><td>${data.end_complemento || '-'}</td></tr>
                    <tr><td>Bairro</td><td>${data.end_bairro || '-'}</td></tr>
                    <tr><td>Cidade/UF</td><td>${data.end_cidade || '-'} / ${data.end_uf || '-'}</td></tr>
                    <tr><td>CEP</td><td>${data.end_cep || '-'}</td></tr>
                    <tr><td>Código Município</td><td>${data.codigo_municipio || '-'}</td></tr>
                </table>
                
                <div class="section">Endereço de Cobrança</div>
                <table>
                    <tr><td>Tipo Logradouro</td><td>${data.end_cobranca_tipo_logradouro || '-'}</td></tr>
                    <tr><td>Logradouro</td><td>${data.end_cobranca_logradouro || '-'}</td></tr>
                    <tr><td>Número</td><td>${data.end_cobranca_numero || '-'}</td></tr>
                    <tr><td>Andar</td><td>${data.end_cobranca_andar || '-'}</td></tr>
                    <tr><td>Complemento</td><td>${data.end_cobranca_complemento || '-'}</td></tr>
                    <tr><td>Bairro</td><td>${data.end_cobranca_bairro || '-'}</td></tr>
                    <tr><td>Cidade/UF</td><td>${data.end_cobranca_cidade || '-'} / ${data.end_cobranca_uf || '-'}</td></tr>
                    <tr><td>CEP</td><td>${data.end_cobranca_cep || '-'}</td></tr>
                </table>
                
                <div class="section">Endereço de Entrega</div>
                <table>
                    <tr><td>Tipo Logradouro</td><td>${data.end_entrega_tipo_logradouro || '-'}</td></tr>
                    <tr><td>Logradouro</td><td>${data.end_entrega_logradouro || '-'}</td></tr>
                    <tr><td>Número</td><td>${data.end_entrega_numero || '-'}</td></tr>
                    <tr><td>Andar</td><td>${data.end_entrega_andar || '-'}</td></tr>
                    <tr><td>Complemento</td><td>${data.end_entrega_complemento || '-'}</td></tr>
                    <tr><td>Bairro</td><td>${data.end_entrega_bairro || '-'}</td></tr>
                    <tr><td>Cidade/UF</td><td>${data.end_entrega_cidade || '-'} / ${data.end_entrega_uf || '-'}</td></tr>
                    <tr><td>CEP</td><td>${data.end_entrega_cep || '-'}</td></tr>
                </table>
                
                <div class="section">Contato</div>
                <table>
                    ${telefonesHTML || '<tr><td colspan="2">Nenhum telefone cadastrado</td></tr>'}
                    <tr><td>Email</td><td>${data.email || '-'}</td></tr>
                    <tr><td>Site</td><td>${data.site || '-'}</td></tr>
                </table>
                
                <div class="section">Observações</div>
                <table>
                    <tr><td colspan="2">${data.obs || 'Nenhuma observação'}</td></tr>
                </table>
                
                <div class="section">Informações do Sistema</div>
                <table>
                    <tr><td>Data de Criação</td><td>${new Date(data.data_criacao).toLocaleString('pt-BR')}</td></tr>
                </table>
            </body>
            </html>
        `;

        const janela = window.open('', '_blank');
        janela.document.write(html);
        janela.document.close();
    } catch (error) {
        mostrarAlerta('Erro ao gerar relatório: ' + error.message, 'error');
    }
}

function gerarRelatorioFiltro() {
    if (clientesFiltrados.length === 0) {
        mostrarAlerta('Não há clientes para gerar relatório!', 'error');
        return;
    }

    let html = `
        <html>
        <head>
            <title>SIRIUS WEB - Relatório de Clientes</title>
            <style>
                body { font-family: Arial; padding: 20px; }
                h1 { color: #667eea; }
                .subtitle { color: #999; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                th { background: #667eea; color: white; }
            </style>
        </head>
        <body>
            <h1>📄 SIRIUS WEB</h1>
            <div class="subtitle">Relatório de Clientes</div>
            <p><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
            <p><strong>Total de clientes:</strong> ${clientesFiltrados.length}</p>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Razão Social</th>
                        <th>CNPJ</th>
                        <th>Cidade/UF</th>
                        <th>Telefones</th>
                    </tr>
                </thead>
                <tbody>
    `;

    clientesFiltrados.forEach(c => {
        const telefones = c.telefone && c.telefone.length > 0 ? c.telefone[0].numero : '-';
        const cidadeUF = `${c.end_cidade || '-'} / ${c.end_uf || '-'}`;
        html += `
            <tr>
                <td>${c.id}</td>
                <td>${c.razao_social}</td>
                <td>${formatarCNPJExibicao(c.cnpj)}</td>
                <td>${cidadeUF}</td>
                <td>${telefones}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
        </body>
        </html>
    `;

    const janela = window.open('', '_blank');
    janela.document.write(html);
    janela.document.close();
}

// ============================================================================
// FUNÇÕES DE MODAL
// ============================================================================
function fecharModal() {
    document.getElementById('modal').style.display = 'none';
}

function fecharModalFiltro() {
    document.getElementById('modalFiltro').style.display = 'none';
}

function mostrarConfirm(mensagem, callback) {
    document.getElementById('confirmMessage').textContent = mensagem;
    document.getElementById('confirmModal').style.display = 'block';
    
    const btnYes = document.getElementById('btnConfirmYes');
    const newBtnYes = btnYes.cloneNode(true);
    btnYes.parentNode.replaceChild(newBtnYes, btnYes);
    
    newBtnYes.onclick = function() {
        fecharConfirm();
        if (callback) callback();
    };
}

function fecharConfirm() {
    document.getElementById('confirmModal').style.display = 'none';
    confirmCallback = null;
}

