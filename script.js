// ✅ COLE SUA NOVA URL AQUI TAMBÉM:
const API_URL = "https://script.google.com/macros/s/AKfycbzS28qCIqnU8mM6nTbkdFQNeXHx2QeSUPB2JCp9nYxZywxTiZvJw9RxezNnHdOU_0yJeQ/exec";

// 💰 CONFIGURAÇÃO DE TAXAS
const TAXAS = { 1: 1.00, 2: 1.045, 3: 1.060, 4: 1.075, 5: 1.090, 6: 1.105 };
const VALOR_BASE = 200.00;

let currentStep = 1;
let isMinor = false;
let diasSelecionados = [];

// --- MÁSCARAS ---
document.addEventListener("DOMContentLoaded", function() {
    const applyCpfMask = (e) => { let x = e.target.value.replace(/\D/g, '').match(/(\d{0,3})(\d{0,3})(\d{0,3})(\d{0,2})/); e.target.value = !x[2] ? x[1] : x[1] + '.' + x[2] + (x[3] ? '.' + x[3] : '') + (x[4] ? '-' + x[4] : ''); };
    const applyTelMask = (e) => { let x = e.target.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,5})(\d{0,4})/); e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : ''); };
    const blockNum = (e) => { e.target.value = e.target.value.replace(/[0-9]/g, ''); };

    const ids = { cpf: ['cpfParticipante', 'respCpf'], tel: ['telefone', 'respTelefone', 'emergenciaTelefone'], nome: ['nome', 'respNome', 'emergenciaNome'] };
    ids.cpf.forEach(id => { const el = document.getElementById(id); if(el) el.addEventListener('input', applyCpfMask); });
    ids.tel.forEach(id => { const el = document.getElementById(id); if(el) el.addEventListener('input', applyTelMask); });
    ids.nome.forEach(id => { const el = document.getElementById(id); if(el) el.addEventListener('input', blockNum); });
    
    // Tema
    const savedTheme = localStorage.getItem('theme');
    const btn = document.getElementById('btnTheme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        if(btn) btn.innerText = "☀️ Modo Claro";
    }
});

// --- NAVEGAÇÃO ---
function nextStep(step) {
    if (!validateStep(step)) return;

    if (step === 1) {
        checkAgeLogic();
        if (!isMinor) { goToStep(3); return; }
    }
    
    if (step === 2) {
        const allow = document.getElementById('respAutorizaPernoite').value;
        const sel = document.getElementById('permanencia');
        for(let opt of sel.options) opt.disabled = false;
        if (allow === "Não") {
            for(let opt of sel.options) if(opt.value === "Todos" || opt.value === "Parcial") opt.disabled = true;
            if(sel.value === "Todos" || sel.value === "Parcial") sel.value = "";
            document.getElementById('avisoPernoite').classList.remove('hidden');
        } else {
            document.getElementById('avisoPernoite').classList.add('hidden');
        }
    }

    if (step === 3) {
        const p = document.getElementById('permanencia').value;
        if ((p === "Todos" || p === "Parcial" || p === "Day Use") && diasSelecionados.length === 0) {
             alert("Selecione os dias."); return;
        }
    }

    goToStep(step + 1);
}

function prevStep(step) {
    if (step === 3 && !isMinor) { goToStep(1); return; }
    goToStep(step - 1);
}

function goToStep(step) {
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    document.getElementById(`step${step}`).classList.add('active');
    document.getElementById('progressFill').style.width = `${(step / 4) * 100}%`;
    currentStep = step;
    window.scrollTo(0, 0);
}

// --- LOGICA GERAL ---
function toggleIgreja() {
    const v = document.getElementById('igrejaSelect').value;
    const w = document.getElementById('outraIgrejaWrapper');
    const i = document.getElementById('igrejaOutra');
    if(v === "Outra") { w.classList.remove('hidden'); i.setAttribute('required','required'); }
    else { w.classList.add('hidden'); i.removeAttribute('required'); i.value=""; }
}

document.getElementById('nascimento').addEventListener('change', function() {
    const d = new Date(this.value), t = new Date();
    let a = t.getFullYear() - d.getFullYear();
    if(t.getMonth() < d.getMonth() || (t.getMonth()===d.getMonth() && t.getDate()<d.getDate())) a--;
    document.getElementById('idade').value = a;
});

function checkAgeLogic() {
    const v = document.getElementById('idade').value;
    isMinor = (v && parseInt(v) < 18);
    document.querySelectorAll('#step2 input, #step2 select').forEach(i => {
        if(isMinor) i.setAttribute('required','required'); else { i.removeAttribute('required'); i.value=""; }
    });
}

function toggleDias() {
    const t = document.getElementById('permanencia').value;
    const c = document.getElementById('diasContainer');
    const b = document.querySelectorAll('.day-bubble');
    
    if(t==="") { c.classList.add('hidden'); diasSelecionados=[]; updateBubblesUI(); return; }
    c.classList.remove('hidden');
    
    if(t==="Todos") {
        diasSelecionados=[]; b.forEach(e=>{diasSelecionados.push(e.getAttribute('data-value')); e.classList.add('selected','locked');});
    } else {
        diasSelecionados=[]; b.forEach(e=>{e.classList.remove('selected','locked');});
    }
    document.getElementById('diasSelecionados').value = diasSelecionados.join(',');
}

function selectDay(el) {
    if(document.getElementById('permanencia').value === "Todos") return;
    const v = el.getAttribute('data-value');
    if(diasSelecionados.includes(v)) { diasSelecionados=diasSelecionados.filter(d=>d!==v); el.classList.remove('selected'); }
    else { diasSelecionados.push(v); el.classList.add('selected'); }
    document.getElementById('diasSelecionados').value = diasSelecionados.join(',');
}
function updateBubblesUI() { document.querySelectorAll('.day-bubble').forEach(e=>e.classList.remove('selected','locked')); }

// --- FINANCEIRO E PARCELAS ---
function togglePagamento() {
    const t = document.getElementById('formaPagamento').value;
    document.getElementById('infoPix').classList.add('hidden');
    document.getElementById('infoCartao').classList.add('hidden');
    document.getElementById('parcelamentoContainer').classList.add('hidden');
    
    document.getElementById('detalhesParcelamento').value = "";

    if(t === 'Pix') document.getElementById('infoPix').classList.remove('hidden');
    if(t === 'Cartao') {
        document.getElementById('infoCartao').classList.remove('hidden');
        document.getElementById('parcelamentoContainer').classList.remove('hidden');
        gerarParcelas();
    }
}

function gerarParcelas() {
    const lista = document.getElementById('listaParcelas');
    lista.innerHTML = "";
    
    for (let i = 1; i <= 6; i++) {
        const fator = TAXAS[i];
        const totalComJuros = VALOR_BASE * fator;
        const valorParcela = totalComJuros / i;
        
        const div = document.createElement('div');
        div.className = 'installment-option';
        div.onclick = () => selecionarParcela(div, i, valorParcela, totalComJuros);
        
        div.innerHTML = `
            <span class="inst-label">${i}x de R$ ${valorParcela.toFixed(2)}</span>
            <span class="inst-total">Total: R$ ${totalComJuros.toFixed(2)}</span>
        `;
        lista.appendChild(div);
    }
}

function selecionarParcela(elemento, qtd, valorParc, total) {
    document.querySelectorAll('.installment-option').forEach(e => e.classList.remove('selected'));
    elemento.classList.add('selected');
    const texto = `${qtd}x de R$ ${valorParc.toFixed(2)} (Total: R$ ${total.toFixed(2)})`;
    document.getElementById('detalhesParcelamento').value = texto;
}

// --- VALIDAÇÃO ---
function validateStep(step) {
    const el = document.getElementById(`step${step}`);
    const inps = el.querySelectorAll('input[required], select[required]');
    let ok = true;
    el.querySelectorAll('.error-msg').forEach(m=>m.classList.add('hidden'));
    el.querySelectorAll('.input-error').forEach(i=>i.classList.remove('input-error'));

    inps.forEach(i => {
        if(i.offsetParent === null) return;
        if(!i.value.trim()) { i.classList.add('input-error'); ok=false; return; }
        
        if(i.name==='nome' || i.name==='respNome') if(i.value.length<6) { showError(i); ok=false; }
        if(i.name==='cpf' || i.name==='respCpf') if(i.value.replace(/\D/g,'').length!==11) { showError(i); ok=false; }
        if(i.name.includes('Telefone')) if(i.value.replace(/\D/g,'').length<10) { showError(i); ok=false; }
    });

    if (step === 4) {
        const pgto = document.getElementById('formaPagamento').value;
        if (pgto === 'Cartao' && document.getElementById('detalhesParcelamento').value === "") {
            alert("Selecione uma opção de parcelamento.");
            ok = false;
        }
    }

    if(!ok) alert("Verifique os campos em vermelho.");
    return ok;
}
function showError(i) { i.classList.add('input-error'); const m=i.parentElement.querySelector('.error-msg'); if(m) m.classList.remove('hidden'); }

// --- SUBMIT ---
document.getElementById('rsvpForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    const loading = document.getElementById('loadingOverlay');
    btn.disabled=true; loading.classList.remove('hidden');

    const fd = new FormData(this);
    const d = Object.fromEntries(fd.entries());
    d.isMenor = isMinor;
    d.diasSelecionados = diasSelecionados;

    if (d.formaPagamento === 'Cartao' && d.detalhesParcelamento) {
        d.formaPagamento = `Cartão - ${d.detalhesParcelamento}`;
    }

    fetch(API_URL, { method: 'POST', body: JSON.stringify(d), headers: {"Content-Type":"text/plain;charset=utf-8"} })
    .then(r=>r.json())
    .then(res => {
        loading.classList.add('hidden');
        if(res.success) {
            let msg = `Olá! Fiz minha inscrição pro *Retiro 2026*.\n\n👤 *Nome:* ${d.nome}\n🆔 *ID:* ${res.id}\n💰 *Pgto:* ${d.formaPagamento}\n\n`;
            if(d.formaPagamento.includes("Pix")) msg+="Envio comprovante anexo.";
            else if(d.formaPagamento.includes("Cartão")) msg+="Aguardo link para pagamento no cartão.";
            else msg+="Aguardo contato.";

            document.getElementById('btnWhatsapp').href = `https://wa.me/5521994760764?text=${encodeURIComponent(msg)}`;
            document.getElementById('rsvpForm').classList.add('hidden');
            document.getElementById('successMessage').classList.remove('hidden');
            document.querySelector('.progress-bar').classList.add('hidden');
        } else { alert("Erro: "+res.message); btn.disabled=false; }
    })
    .catch(err => { loading.classList.add('hidden'); alert("Erro conexão."); btn.disabled=false; });
});

// --- MENU & TEMA ---
function toggleMenu() { document.getElementById('settingsMenu').classList.toggle('hidden'); }
document.addEventListener('click', function(event) {
    const menu = document.getElementById('settingsMenu');
    const btn = document.getElementById('btnSettings');
    if (!menu.classList.contains('hidden') && !menu.contains(event.target) && !btn.contains(event.target)) {
        menu.classList.add('hidden');
    }
});
function toggleTheme() {
    const body = document.body;
    const btn = document.getElementById('btnTheme');
    body.classList.toggle('dark-mode');
    if (body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark');
        btn.innerText = "☀️ Modo Claro";
    } else {
        localStorage.setItem('theme', 'light');
        btn.innerText = "🌙 Modo Escuro";
    }
}
function sendFeedback() {
    const msg = "Olá! Tenho uma sugestão/feedback sobre o site do Retiro: ";
    window.open(`https://wa.me/5521994760764?text=${encodeURIComponent(msg)}`, '_blank');
}
