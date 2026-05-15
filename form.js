const CONFIG = {
  emailjs: {
    publicKey:  'SEU_PUBLIC_KEY_EMAILJS',
    serviceId:  'SEU_SERVICE_ID_EMAILJS',
    templateId: 'SEU_TEMPLATE_ID_EMAILJS',
  },
  sheetsWebAppUrl: 'https://script.google.com/macros/s/AKfycbwCw2fUE3VlryBoQ7TTh15hRbnVuxPDwHyuNFfzcCaODGDLv1vVG1hhoqtW6_-im0aS/exec',
  whatsapp: '5531996646079',
};

if (CONFIG.emailjs.publicKey !== 'SEU_PUBLIC_KEY_EMAILJS') {
  emailjs.init(CONFIG.emailjs.publicKey);
}

document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('leadForm');
  if (!form) return;

  // Máscara de telefone
  const telInput = document.getElementById('whatsapp');
  if (telInput) {
    telInput.addEventListener('input', function (e) {
      let v = e.target.value.replace(/\D/g, '').substring(0, 11);
      if (v.length >= 7)      v = `(${v.substring(0,2)}) ${v.substring(2,7)}-${v.substring(7)}`;
      else if (v.length >= 3) v = `(${v.substring(0,2)}) ${v.substring(2)}`;
      else if (v.length >= 1) v = `(${v}`;
      e.target.value = v;
    });
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const btn = document.getElementById('submitBtn');
    btn.disabled = true;
    btn.textContent = 'Enviando...';

    const urlParams = new URLSearchParams(window.location.search);

    const dados = {
      nome:         document.getElementById('nome').value.trim(),
      whatsapp:     document.getElementById('whatsapp').value.trim(),
      email:        (document.getElementById('email') || {}).value || '',
      procedimento: document.getElementById('procedimento').value,
      mensagem:     (document.getElementById('mensagem') || {}).value || '',
      data:         new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      pagina:       document.title,
      origem:       document.referrer || 'Acesso direto',
      utm_source:   urlParams.get('utm_source')   || '',
      utm_medium:   urlParams.get('utm_medium')   || '',
      utm_campaign: urlParams.get('utm_campaign') || '',
    };

    // 1. Google Sheets
    try {
      if (CONFIG.sheetsWebAppUrl !== 'SUA_URL_DO_APPS_SCRIPT') {
        await fetch(CONFIG.sheetsWebAppUrl, {
          method: 'POST',
          mode: 'no-cors',
          body: JSON.stringify(dados),
        });
      }
    } catch (err) { console.warn('Sheets:', err); }

    // 2. EmailJS
    try {
      if (CONFIG.emailjs.publicKey !== 'SEU_PUBLIC_KEY_EMAILJS') {
        await emailjs.send(CONFIG.emailjs.serviceId, CONFIG.emailjs.templateId, {
          from_name:    dados.nome,
          phone:        dados.whatsapp,
          email:        dados.email || 'Não informado',
          procedimento: dados.procedimento,
          mensagem:     dados.mensagem || 'Não informada',
          pagina:       dados.pagina,
          data:         dados.data,
        });
      }
    } catch (err) { console.warn('EmailJS:', err); }

    // 3. WhatsApp
    const texto = encodeURIComponent(
      `Olá, Dra. Camila! 👋\n\nMeu nome é ${dados.nome} e tenho interesse em: *${dados.procedimento}*.\n\nMeu WhatsApp: ${dados.whatsapp}${dados.mensagem ? '\n\n' + dados.mensagem : ''}`
    );

    form.style.display = 'none';
    document.getElementById('successMsg').style.display = 'block';

    setTimeout(() => {
      window.open(`https://wa.me/${CONFIG.whatsapp}?text=${texto}`, '_blank');
    }, 1200);
  });
});
