// ✅ URL DA API
const API_URL = "https://script.google.com/macros/s/AKfycbxO6seIHLd9DwbUtlY0b5LrSYJqUm8iSut2VPqohh3XsuLh2qB5LqKqo_I-GlMFa0Wb_Q/exec";

let currentStep = 1;
let isMinor = false;
let diasSelecionados = [];

// --- NAVEGAÇÃO ---
function nextStep(step) {
    if (!validateStep(step)) return;

    if (step === 1) {
        checkAgeLogic();
        if (!isMinor) {
            goToStep(3); 
            return;
        }
    }
    
    if (step === 2) {
        const allowSleep = document.getElementById('respAutorizaPernoite').value;
        const sleepSelect = document.getElementById('permanencia');
        const warning = document.getElementById('avisoPernoite');

        // Reset
        for(let opt of sleepSelect.options) opt.disabled = false;

        if (allowSleep === "Não") {
            for(let opt of sleepSelect.options) {
                if (opt.value === "Todos" || opt.value === "Parcial") opt.disabled = true;
            }
            if (sleepSelect.value === "Todos" || sleepSelect.value === "Parcial") sleepSelect.value = "";
            warning.classList.remove('hidden');
        } else {
            warning.classList.add('hidden');
        }
    }

    if (step === 3) {
        const perm = document.getElementById('permanencia').value;
        // Valida se selecionou dias para Parcial OU Day Use
        if ((perm === "Todos" || perm === "Parcial" || perm === "Day Use") && diasSelecionados.length === 0) {
            alert("Erro: Selecione os dias de participação.");
            return;
        }
    }

    goToStep(step + 1);
}

function prevStep(step) {
    if (step === 3 && !isMinor) {
        goToStep(1);
        return;
    }
    goToStep(step - 1);
}

function goToStep(step) {
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    document.getElementById(`step${step}`).classList.add('active');
    const progress = (step / 4) * 100;
    document.getElementById('progressFill').style.width = `${progress}%`;
    currentStep = step;
    window.scrollTo(0, 0);
}

// --- LÓGICA DE IGREJA ---
function toggleIgreja() {
    const select = document.getElementById('igrejaSelect');
    const wrapper = document.getElementById('outraIgrejaWrapper');
    const inputOutra = document.getElementById('igrejaOutra');

    if (select.value === "Outra") {
        wrapper.classList.remove('hidden');
        inputOutra.setAttribute('required', 'required');
    } else {
        wrapper.classList.add('hidden');
        inputOutra.removeAttribute('required');
        inputOutra.value = "";
    }
}

// --- LÓGICA DE IDADE ---
document.getElementById('nascimento').addEventListener('change', function() {
    const dob = new Date(this.value);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    document.getElementById('idade').value = age;
});

function checkAgeLogic() {
    const ageVal = document.getElementById('idade').value;
    const age = ageVal ? parseInt(ageVal) : 0;
    isMinor = age < 18;
    const respInputs = document.querySelectorAll('#step2 input, #step2 select');
    respInputs.forEach(input => {
        if (isMinor) input.setAttribute('required', 'required');
        else {
            input.removeAttribute('required');
            input.value = ""; 
        }
    });
}

// --- LÓGICA DE DIAS ---
function toggleDias() {
    const tipo = document.getElementById('permanencia').value;
    const container = document.getElementById('diasContainer');
    const bubbles = document.querySelectorAll('.day-bubble');

    if (tipo === "") {
        container.classList.add('hidden');
        diasSelecionados = [];
        updateBubblesUI();
    } else {
        // Mostra container para Todos, Parcial e Day Use
        container.classList.remove('hidden');
        
        if (tipo === "Todos") {
            // Marca tudo e bloqueia
            diasSelecionados = [];
            bubbles.forEach(b => {
                diasSelecionados.push(b.getAttribute('data-value'));
                b.classList.add('selected', 'locked');
            });
        } else {
            // Parcial ou Day Use: Limpa e deixa usuário escolher
            diasSelecionados = [];
            bubbles.forEach(b => {
                b.classList.remove('selected', 'locked');
            });
        }
    }
    document.getElementById('diasSelecionados').value = diasSelecionados.join(',');
}

function selectDay(element) {
    const tipo = document.getElementById('permanencia').value;
    if (tipo === "Todos") return; // Não pode desmarcar se for todos

    const val = element.getAttribute('data-value');
    if (diasSelecionados.includes(val)) {
        diasSelecionados = diasSelecionados.filter(d => d !== val);
        element.classList.remove('selected');
    } else {
        diasSelecionados.push(val);
        element.classList.add('selected');
    }
    document.getElementById('diasSelecionados').value = diasSelecionados.join(',');
}

function updateBubblesUI() {
    document.querySelectorAll('.day-bubble').forEach(b => {
        b.classList.remove('selected', 'locked');
    });
}

// --- PAGAMENTO ---
function togglePagamento() {
    const tipo = document.getElementById('formaPagamento').value;
    document.getElementById('infoPix').classList.add('hidden');
    document.getElementById('infoCartao').classList.add('hidden');

    if (tipo === 'Pix') document.getElementById('infoPix').classList.remove('hidden');
    if (tipo === 'Cartao') document.getElementById('infoCartao').classList.remove('hidden');
}

// --- VALIDAÇÃO ---
function validateStep(step) {
    const stepEl = document.getElementById(`step${step}`);
    const inputs = stepEl.querySelectorAll('input[required], select[required]');
    let valid = true;

    inputs.forEach(input => {
        if (input.offsetParent === null) return; 
        if (!input.value) {
            input.style.borderColor = "#ef4444";
            valid = false;
        } else {
            input.style.borderColor = "#cbd5e1";
        }
    });

    if (!valid) alert("Preencha os campos obrigatórios.");
    return valid;
}

// --- ENVIO + WHATSAPP ---
document.getElementById('rsvpForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const submitBtn = document.getElementById('submitBtn');
    const loading = document.getElementById('loadingOverlay');
    
    submitBtn.disabled = true;
    loading.classList.remove('hidden');

    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());
    data.isMenor = isMinor;
    data.diasSelecionados = diasSelecionados;

    fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { "Content-Type": "text/plain;charset=utf-8" }
    })
    .then(response => response.json())
    .then(result => {
        loading.classList.add('hidden');
        if (result.success) {
            
            // --- GERAÇÃO DO LINK DE WHATSAPP ---
            const nomeInscrito = data.nome.split(" ")[0];
            const idInscricao = result.id;
            const formaPgto = data.formaPagamento;
            const phone = "5521994760764";

            let msg = `Olá! Fiz minha inscrição pro *Retiro 2026* e gostaria de finalizar.\n\n`;
            msg += `👤 *Nome:* ${data.nome}\n`;
            msg += `🆔 *ID:* ${idInscricao}\n`;
            msg += `💰 *Pgto:* ${formaPgto}\n\n`;

            if (formaPgto === "Pix") {
                msg += "Estou enviando o comprovante em anexo! 👇";
            } else if (formaPgto === "Cartao") {
                msg += "Gostaria de receber o link para pagamento no cartão.";
            } else if (formaPgto === "Conversar") {
                msg += "Gostaria de conversar sobre as condições de pagamento.";
            }

            const finalUrl = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
            document.getElementById('btnWhatsapp').href = finalUrl;
            
            // --- TELA FINAL ---
            document.getElementById('rsvpForm').classList.add('hidden');
            document.getElementById('successMessage').classList.remove('hidden');
            document.querySelector('.progress-bar').classList.add('hidden');

        } else {
            alert("Erro: " + result.message);
            submitBtn.disabled = false;
        }
    })
    .catch(error => {
        loading.classList.add('hidden');
        console.error(error);
        alert("Erro de conexão.");
        submitBtn.disabled = false;
    });
});