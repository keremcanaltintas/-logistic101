// ==========================================================================
// LOGIN & PANEL SWITCHING LOGIC
// ==========================================================================

const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.getElementById('container');
const loginForm = document.getElementById('login-form');
const loginToast = document.getElementById('login-toast');
const loginBtn = document.getElementById('login-btn');

// Giriş ve Kayıt Paneli Geçişi
if (signUpButton && signInButton && container) {
	signUpButton.addEventListener('click', () => {
		container.classList.add("right-panel-active");
		hideToast();
	});

	signInButton.addEventListener('click', () => {
		container.classList.remove("right-panel-active");
		hideToast();
	});
}

// Mobil Cihazlar İçin Giriş ve Kayıt Paneli Geçişi
const signUpMobileButton = document.getElementById('signUpMobile');
const signInMobileButton = document.getElementById('signInMobile');

if (signUpMobileButton && container) {
	signUpMobileButton.addEventListener('click', (e) => {
		e.preventDefault();
		container.classList.add("right-panel-active");
		hideToast();
	});
}

if (signInMobileButton && container) {
	signInMobileButton.addEventListener('click', (e) => {
		e.preventDefault();
		container.classList.remove("right-panel-active");
		hideToast();
	});
}

// Toast Bildirimi Göster / Gizle
function showToast(message) {
	loginToast.textContent = message;
	loginToast.style.display = 'block';
	
	// Giriş Yap butonuna sallanma efekti uygula
	loginBtn.classList.add('shake-anim');
	setTimeout(() => {
		loginBtn.classList.remove('shake-anim');
	}, 500);
}

function hideToast() {
	loginToast.style.display = 'none';
}

// Giriş Denetimi (Username: 123456, Password: 123456 veya kayıtlı kullanıcılar)
if (loginForm) {
	loginForm.addEventListener('submit', (e) => {
		e.preventDefault();
		
		const usernameVal = document.getElementById('username-input').value.trim();
		const passwordVal = document.getElementById('password-input').value;
		
		// Kayıtlı kullanıcıları localStorage'dan al
		let users = [];
		try {
			users = JSON.parse(localStorage.getItem('nestro_registered_users') || '[]');
		} catch (err) {
			users = [];
		}
		
		// Giriş Şifresi Kaldırıldı: Kullanıcı adı girilmesi yeterlidir.
		if (usernameVal) {
			// Başarılı Giriş
			hideToast();
			loginBtn.disabled = true;
			loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Giriş Yapılıyor...';
			
			const displayName = usernameVal;
			
			// 1 saniyelik şık bir bekleme animasyonu (SaaS kalitesi için)
			setTimeout(() => {
				localStorage.setItem('nestro_logged_in', 'true');
				localStorage.setItem('nestro_username', displayName);
				
				// Arayüzü Güncelle ve Dashboard'a geç
				initDashboard(displayName);
				
				// Giriş Ekranını Kapat, Dashboard'u Aç
				transitionToDashboard();
			}, 1000);
		} else {
			// Hatalı Giriş (Kullanıcı adı boş)
			showToast('Lütfen bir kullanıcı adı giriniz!');
		}
	});
}

// Kayıt Ol Formu Gönderim Denetimi
const signupForm = document.getElementById('signup-form');
if (signupForm) {
	signupForm.addEventListener('submit', (e) => {
		e.preventDefault();
		
		const nameVal = document.getElementById('signup-name-input').value.trim();
		const emailVal = document.getElementById('signup-email-input').value.trim();
		const passwordVal = document.getElementById('signup-password-input').value;
		
		if (!nameVal || !emailVal || !passwordVal) {
			alert('Lütfen tüm alanları doldurun.');
			return;
		}
		
		// Kayıtlı kullanıcıları localStorage'dan al
		let users = [];
		try {
			users = JSON.parse(localStorage.getItem('nestro_registered_users') || '[]');
		} catch (err) {
			users = [];
		}
		
		// E-posta adresiyle daha önce kayıt olunmuş mu kontrol et
		const userExists = users.some(u => u.email.toLowerCase() === emailVal.toLowerCase());
		if (userExists) {
			alert('Bu e-posta adresiyle zaten kayıtlı bir hesap var!');
			return;
		}
		
		// Yeni kullanıcıyı ekle
		users.push({
			name: nameVal,
			email: emailVal,
			password: passwordVal
		});
		
		localStorage.setItem('nestro_registered_users', JSON.stringify(users));
		
		alert('Hesabınız başarıyla oluşturuldu! Şimdi bu bilgilerle Giriş Yapabilirsiniz.');
		
		// Giriş yapma paneline yönlendir
		if (container) {
			container.classList.remove("right-panel-active");
		}
		
		// Giriş yapma formundaki kullanıcı adı/şifre alanlarını otomatik doldur
		const loginUsernameInput = document.getElementById('username-input');
		const loginPasswordInput = document.getElementById('password-input');
		if (loginUsernameInput) loginUsernameInput.value = emailVal;
		if (loginPasswordInput) loginPasswordInput.value = passwordVal;
		
		// Formu sıfırla
		signupForm.reset();
	});
}

// Giriş Ekranından Dashboard'a Geçiş Animasyonu
function transitionToDashboard() {
	const loginPage = document.getElementById('login-page');
	const dashboardPage = document.getElementById('dashboard-page');
	
	loginPage.classList.add('fade-out');
	dashboardPage.style.display = 'flex';
	showChatbot();
	
	setTimeout(() => {
		loginPage.style.display = 'none';
		
		let lastView = localStorage.getItem('nestro_current_view') || 'dashboard';
		switchView(lastView);
	}, 600);
}

// Çıkış Yap Mantığı
function logout() {
	localStorage.removeItem('nestro_logged_in');
	localStorage.removeItem('nestro_username');
	hideChatbot();
	// nestro_setup_completed silinmez, geri dönen kullanıcılar sihirbazı görmez.
	
	// Sihirbazı temizle
	clearWizardHighlight();
	const overlay = document.getElementById('wizard-overlay');
	const tooltip = document.getElementById('wizard-tooltip');
	if (overlay) overlay.classList.remove('active');
	if (tooltip) tooltip.classList.remove('active');
	stopConfetti();
	
	const loginPage = document.getElementById('login-page');
	const dashboardPage = document.getElementById('dashboard-page');
	
	// Formu sıfırla
	if (loginForm) loginForm.reset();
	if (loginBtn) {
		loginBtn.disabled = false;
		loginBtn.innerHTML = 'Giriş Yap';
	}
	
	if (loginPage) loginPage.style.display = 'flex';
	setTimeout(() => {
		if (loginPage) loginPage.classList.remove('fade-out');
		if (dashboardPage) dashboardPage.style.display = 'none';
	}, 50);
}

// Sayfa Yüklendiğinde Oturum Kontrolü
function checkLoginAndRoute() {
	const isLoggedIn = localStorage.getItem('nestro_logged_in');
	const savedUsername = localStorage.getItem('nestro_username');
	
	if (isLoggedIn === 'true' && savedUsername) {
		initDashboard(savedUsername);
		document.getElementById('login-page').style.display = 'none';
		document.getElementById('dashboard-page').style.display = 'flex';
		showChatbot();
		let lastView = localStorage.getItem('nestro_current_view') || 'dashboard';
		switchView(lastView);
	}
	setupModalScrollBlocker();
}

// Modal açıldığında arka sayfa kaymasını engelleme (Blokaj)
function setupModalScrollBlocker() {
	const modalObserver = new MutationObserver(() => {
		const activeModals = document.querySelectorAll('.modal-backdrop');
		let anyOpen = false;
		activeModals.forEach(m => {
			if (m.style.display && m.style.display !== 'none') {
				anyOpen = true;
			}
		});
		if (anyOpen) {
			document.body.classList.add('modal-open');
		} else {
			document.body.classList.remove('modal-open');
		}
	});

	document.querySelectorAll('.modal-backdrop').forEach(modal => {
		modalObserver.observe(modal, { attributes: true, attributeFilter: ['style'] });
	});
}

// Modalı animasyonlu (Fade Out) şekilde kapatan yardımcı fonksiyon
function closeModalWithAnimation(modalId, onFinished = null) {
	const modal = document.getElementById(modalId);
	if (!modal) return;
	
	modal.classList.add('closing');
	
	setTimeout(() => {
		modal.style.display = 'none';
		modal.classList.remove('closing');
		if (onFinished) onFinished();
	}, 240);
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', checkLoginAndRoute);
} else {
	checkLoginAndRoute();
}

// Dashboard Bilgilerini Dinamik Doldurma
function initDashboard(username) {
	const displays = ['username-display'];
	displays.forEach(id => {
		const el = document.getElementById(id);
		if (el) el.textContent = username;
	});
	
	// Canlı tarihi güncelliyoruz
	updateLiveDate();
	
	// Görevleri render ediyoruz
	renderTasks();

	// Siparişleri render ediyoruz
	renderOrders();

	// Menü geçişlerini ve tıklamalarını ayarlıyoruz
	initNavigation();
	
	// Arama çubuğu olay dinleyicisi
	initSearchListener();

	// Yeni Sipariş Kodu alanını güncelle
	updateNextOrderCodeField();

	// Ürünleri render et
	renderProducts();
	renderStockRecordsHistory();

	// Cüzdan verilerini render et ve bakiyeyi güncelle
	renderTransactions();
	updateBalanceDisplay();

	// Destek taleplerini render et
	renderTickets();

	// Rapor finansal log tablosunu render et
	renderReportTransactions();

	// Kargo firması ayarlarını başlat
	initCarrierSettings();

	// Entegre mağazaların durumlarını başlat
	initConnectedStores();

	// Dashboard Grafiklerini Başlat
	setTimeout(initCharts, 100);
}


// ==========================================================================
// YENİ ÖZELLİKLER: ARAMA BARI & CANLI TARİH
// ==========================================================================

// Global Arama Barı Dinleyicisi
function initSearchListener() {
	const searchInput = document.getElementById('global-search');
	if (searchInput) {
		searchInput.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') {
				const query = searchInput.value.trim();
				// Arama yapıldığında siparişler tabına geç ve süzgeçle
				switchView('orders');
				renderOrders(currentFilter, query);
			}
		});

		// Ayrıca input boşaltıldığında veya değiştiğinde gerçek zamanlı süzgeç
		searchInput.addEventListener('input', () => {
			const query = searchInput.value.trim();
			const ordersView = document.getElementById('orders-view');
			if (ordersView && ordersView.style.display === 'block') {
				renderOrders(currentFilter, query);
			}
		});
	}
}

// Türkçe Canlı Tarih Gösterimi (Örn: "23 Mayıs 2026")
function updateLiveDate() {
	const dateEl = document.getElementById('live-date');
	if (dateEl) {
		const now = new Date();
		const options = { day: 'numeric', month: 'long', year: 'numeric' };
		
		// Türkçe lokalinde tarihi biçimlendir
		const formatter = new Intl.DateTimeFormat('tr-TR', options);
		dateEl.textContent = formatter.format(now);
	}
}


// ==========================================================================
// DİNAMİK GÖREV YÖNETİMİ & ÖNCELİK ETİKETLERİ
// ==========================================================================

// Varsayılan Görev Verileri
let tasks = [
	{ id: 'task-1', title: 'Yeni mağaza kurulumunu doğrula', desc: 'Shopify API bağlantısı başarıyla tamamlandı.', priority: 'high', completed: true },
	{ id: 'task-2', title: 'Stok verilerini eşitle', desc: 'Fulfillment depo stokları mağazayla eşitlendi.', priority: 'medium', completed: true },
	{ id: 'task-3', title: 'Bekleyen 5 siparişi onayla', desc: 'Otomatik gönderim sırasındaki siparişleri onaylamanız gerekir.', priority: 'high', completed: false },
	{ id: 'task-4', title: 'Cüzdan bakiyesini yükle', desc: 'Kargo gönderim bedellerinin ödenebilmesi için bakiye ekleyin.', priority: 'low', completed: false }
];

// HTML Kaçış Fonksiyonu (XSS Koruması)
function escapeHTML(str) {
	return str.replace(/[&<>'"]/g, 
		tag => ({
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			"'": '&#39;',
			'"': '&quot;'
		}[tag] || tag)
	);
}

// Görevleri Ekrana Çizme
function renderTasks() {
	const listEl = document.getElementById('tasks-list');
	if (!listEl) return;
	
	listEl.innerHTML = '';
	tasks.forEach(task => {
		const item = document.createElement('div');
		item.className = `task-item ${task.completed ? 'completed' : ''}`;
		item.setAttribute('data-task-id', task.id);
		
		let priorityText = 'Orta Öncelik';
		if (task.priority === 'high') priorityText = 'Yüksek Öncelik';
		if (task.priority === 'low') priorityText = 'Düşük Öncelik';
		
		item.innerHTML = `
			<div class="task-checkbox">
				<input type="checkbox" id="chk-${task.id}" ${task.completed ? 'checked' : ''} onchange="toggleTaskStatus('${task.id}')">
				<label for="chk-${task.id}"></label>
			</div>
			<div class="task-info">
				<span class="task-title">${escapeHTML(task.title)}</span>
				<span class="task-desc">${escapeHTML(task.desc)}</span>
			</div>
			<div class="task-badges">
				<span class="priority-tag ${task.priority}">${priorityText}</span>
			</div>
			<button class="btn-delete-task" onclick="deleteTask('${task.id}')" title="Görevi Sil">
				<i class="fa-regular fa-trash-can"></i>
			</button>
		`;
		listEl.appendChild(item);
	});
	
	updateTaskCountDisplay();
}

// Görev Tamamlandı/Yapılmadı Durumu Değiştirme
function toggleTaskStatus(id) {
	const task = tasks.find(t => t.id === id);
	if (task) {
		task.completed = !task.completed;
		renderTasks();
	}
}

// Görev Silme
function deleteTask(id) {
	tasks = tasks.filter(t => t.id !== id);
	renderTasks();
}

// Form Üzerinden Yeni Görev Ekleme
function handleAddTask(e) {
	e.preventDefault();
	
	const descEl = document.getElementById('new-task-desc');
	const priorityEl = document.getElementById('new-task-priority');
	
	if (!descEl || !priorityEl) return;
	
	const titleVal = descEl.value.trim();
	const priorityVal = priorityEl.value;
	
	if (!titleVal) return;
	
	const newId = 'task-' + Date.now();
	
	// Yeni görevi listeye ekle
	tasks.push({
		id: newId,
		title: titleVal,
		desc: 'Manuel olarak eklenen günlük görev.',
		priority: priorityVal,
		completed: false
	});
	
	// Form elemanlarını temizle
	descEl.value = '';
	priorityEl.value = 'medium';
	
	// Listeyi yeniden render et
	renderTasks();
}

// Görev İlerleme Metnini Güncelleme
function updateTaskCountDisplay() {
	const countEl = document.getElementById('task-count-display');
	if (!countEl) return;
	
	const completedCount = tasks.filter(t => t.completed).length;
	countEl.textContent = `${completedCount}/${tasks.length} Tamamlandı`;
}


// ==========================================================================
// ÇİFT AŞAMALI AKILLI ONBOARDING SİHİRBAZI MANTIĞI
// ==========================================================================

let currentWizardType = 1; // 1: Mağaza Bağlama Turu, 2: Dashboard Turu
let currentStepIndex = 0;
let highlightedElement = null;

const wizard1Steps = [
	{
		target: '#connect-store-url',
		text: 'Shopify mağaza adınızı buraya uzantısı olmadan yazın, sistem otomatik olarak sonuna myshopify.com ekleyip düzeltecektir.',
		btnText: 'Sonraki'
	},
	{
		target: '#connect-api-token',
		text: 'Shopify yönetim panelinizden aldığınız Admin API erişim jetonunu (shpat_...) buraya yapıştırın.',
		btnText: 'Eğitimi Bitir'
	}
];

const wizard2Steps = [
	{
		target: '#status-cards-container',
		text: 'Siparişleriniz entegre edildiği an bu durum kartları üzerinde canlı olarak takip edilecektir.',
		btnText: 'Sonraki'
	},
	{
		target: '#nav-wallet',
		text: 'Kargo kesintilerini, ödemelerinizi ve bakiye yüklemelerinizi bu cüzdan panelinden anlık izleyebilirsiniz.',
		btnText: 'Kurulumu Tamamla'
	}
];

// Sihirbaz 1'i Başlat (Mağaza Bağla Arayüzü)
function startWizard1() {
	currentWizardType = 1;
	currentStepIndex = 0;
	switchView('connect');
	stopConfetti();
	setTimeout(() => {
		showStep(0);
	}, 400);
}

// Sihirbaz 2'yi Başlat (Dashboard Arayüzü)
function startWizard2() {
	currentWizardType = 2;
	currentStepIndex = 0;
	switchView('dashboard');
	stopConfetti();
	setTimeout(() => {
		showStep(0);
	}, 400);
}

// Belirli Bir Adımı Göster
function showStep(index) {
	const currentSteps = currentWizardType === 1 ? wizard1Steps : wizard2Steps;
	if (index < 0 || index >= currentSteps.length) return;
	currentStepIndex = index;
	
	const step = currentSteps[index];
	const overlay = document.getElementById('wizard-overlay');
	const tooltip = document.getElementById('wizard-tooltip');
	
	if (!overlay || !tooltip) return;

	// Eski vurgulamaları temizle
	clearWizardHighlight();
	stopConfetti();
	
	overlay.classList.add('active');
	
	// Tooltip İçeriğini Güncelle
	const textEl = document.getElementById('wizard-text');
	const progressEl = document.getElementById('wizard-progress');
	const nextBtn = document.getElementById('wizard-next-btn');
	
	if (progressEl) progressEl.textContent = `Adım ${index + 1}/${currentSteps.length}`;
	if (nextBtn) nextBtn.textContent = step.btnText;
	if (textEl) textEl.innerHTML = `<p>${step.text}</p>`;
	
	// Elemanı Vurgula
	const element = document.querySelector(step.target);
	if (element) {
		highlightedElement = element;
		element.classList.add('wizard-highlighted');
		element.scrollIntoView({ behavior: 'smooth', block: 'center' });
		
		// Tooltip'i konumlandırmak için elementin yerleşmesini bekle (smooth scroll sonrası)
		setTimeout(() => {
			tooltip.classList.add('active');
			positionTooltip(element, step.target);
		}, 300);
	} else {
		// Eleman bulunamazsa bir sonraki adıma atla
		nextStep();
	}
}

// Sonraki Adım
function nextStep() {
	const currentSteps = currentWizardType === 1 ? wizard1Steps : wizard2Steps;
	if (currentStepIndex === currentSteps.length - 1) {
		// Son adımdayız
		if (currentWizardType === 1) {
			finishWizard1();
		} else {
			finishWizard2();
		}
	} else {
		showStep(currentStepIndex + 1);
	}
}

// Eğitimi Atla / Kapat
function skipWizard() {
	closeWizardUI();
	localStorage.setItem('nestro_setup_completed', 'true');
	switchView('dashboard');
}

// Birinci Aşama Sihirbazını Bitir
function finishWizard1() {
	closeWizardUI();
	showNotification('Eğitimi tamamladınız. Lütfen Shopify bilgilerinizi girip mağazanızı bağlayın.', 'success');
}

// İkinci Aşama Sihirbazını Bitir
function finishWizard2() {
	closeWizardUI();
	startConfetti();
	localStorage.setItem('nestro_setup_completed', 'true');
	showNotification('Tebrikler! Kurulum başarıyla tamamlandı.', 'success');
	setTimeout(() => {
		stopConfetti();
	}, 4000);
}

// Sihirbaz Arayüzünü Kapat
function closeWizardUI() {
	clearWizardHighlight();
	stopConfetti();
	
	const overlay = document.getElementById('wizard-overlay');
	const tooltip = document.getElementById('wizard-tooltip');
	
	if (overlay) overlay.classList.remove('active');
	if (tooltip) tooltip.classList.remove('active');
	
	setTimeout(() => {
		if (tooltip) {
			tooltip.classList.remove('centered');
			tooltip.removeAttribute('data-popper-arrow');
		}
	}, 300);
}

// Vurgulanmış Eleman Sınıfını Temizle
function clearWizardHighlight() {
	if (highlightedElement) {
		highlightedElement.classList.remove('wizard-highlighted');
		highlightedElement = null;
	}
	document.querySelectorAll('.wizard-highlighted').forEach(el => {
		el.classList.remove('wizard-highlighted');
	});
}

// Tooltip'i Vurgulanan Elemana Göre Akıllıca Konumlandır
function positionTooltip(element, selector) {
	const tooltip = document.getElementById('wizard-tooltip');
	if (!tooltip) return;
	tooltip.classList.remove('centered');
	
	const rect = element.getBoundingClientRect();
	const tooltipWidth = tooltip.offsetWidth;
	const tooltipHeight = tooltip.offsetHeight;
	
	const scrollY = window.scrollY || document.documentElement.scrollTop;
	const scrollX = window.scrollX || document.documentElement.scrollLeft;
	
	let top = 0;
	let left = 0;
	let arrowDir = 'left';
	
	// Elemanın id'sine veya sayfadaki konumuna göre yön seçimi
	if (selector.includes('nav-')) {
		// Sol sidebar menü öğeleri için sağa yerleştir
		arrowDir = 'left';
		left = rect.right + 18 + scrollX;
		top = rect.top + (rect.height / 2) - (tooltipHeight / 2) + scrollY;
		
		if (top < scrollY + 16) top = scrollY + 16;
	} else if (selector === '#status-cards-container' || selector === '#connect-store-url' || selector === '#connect-api-token') {
		// Elemanın altına yerleştir
		arrowDir = 'top';
		left = rect.left + (rect.width / 2) - (tooltipWidth / 2) + scrollX;
		top = rect.bottom + 18 + scrollY;
		
		if (left < scrollX + 16) left = scrollX + 16;
		if (left + tooltipWidth > window.innerWidth + scrollX - 16) {
			left = window.innerWidth + scrollX - tooltipWidth - 16;
		}
	} else {
		// Genel fallback: Altına yerleştir
		arrowDir = 'top';
		left = rect.left + (rect.width / 2) - (tooltipWidth / 2) + scrollX;
		top = rect.bottom + 18 + scrollY;
	}
	
	tooltip.style.top = `${top}px`;
	tooltip.style.left = `${left}px`;
	tooltip.setAttribute('data-popper-arrow', arrowDir);
	
	const arrow = tooltip.querySelector('.wizard-tooltip-arrow');
	if (arrow) {
		if (arrowDir === 'left') {
			const relativeTop = (rect.top + rect.height / 2) - top;
			arrow.style.top = `${relativeTop}px`;
			arrow.style.left = '';
			arrow.style.bottom = '';
			arrow.style.right = '';
		} else if (arrowDir === 'top') {
			const relativeLeft = (rect.left + rect.width / 2) - left;
			arrow.style.left = `${relativeLeft}px`;
			arrow.style.top = '';
			arrow.style.bottom = '';
			arrow.style.right = '';
		}
	}
}

// Pencere Boyutu Değiştiğinde Tooltip Konumunu Güncelle
window.addEventListener('resize', () => {
	const tooltip = document.getElementById('wizard-tooltip');
	if (tooltip && tooltip.classList.contains('active') && !tooltip.classList.contains('centered') && highlightedElement) {
		const currentSteps = currentWizardType === 1 ? wizard1Steps : wizard2Steps;
		const step = currentSteps[currentStepIndex];
		positionTooltip(highlightedElement, step.target);
	}
});


// ==========================================================================
// CSS CONFETTI CELEBRATION EFFECT
// ==========================================================================

let confettiInterval = null;

function startConfetti() {
	const container = document.getElementById('confetti-container');
	if (!container) return;
	
	container.style.display = 'block';
	const colors = ['#28a745', '#20c997', '#ffc107', '#007bff', '#e83e8c', '#fd7e14'];
	
	// Her 150ms'de bir konfeti oluştur
	confettiInterval = setInterval(() => {
		const confetti = document.createElement('div');
		confetti.classList.add('confetti');
		
		// Rastgele konum, renk ve animasyon özellikleri
		const randomX = Math.random() * 100; // Genişlik yüzdesi
		const randomColor = colors[Math.floor(Math.random() * colors.length)];
		const randomSize = Math.random() * 6 + 6; // 6px ile 12px arası
		const randomRotation = Math.random() * 360;
		const randomDuration = Math.random() * 2 + 2; // 2s ile 4s arası
		
		confetti.style.left = `${randomX}vw`;
		confetti.style.backgroundColor = randomColor;
		confetti.style.width = `${randomSize}px`;
		confetti.style.height = `${randomSize}px`;
		confetti.style.transform = `rotate(${randomRotation}deg)`;
		confetti.style.animationDuration = `${randomDuration}s`;
		
		container.appendChild(confetti);
		
		// Animasyon bitince temizle
		setTimeout(() => {
			confetti.remove();
		}, randomDuration * 1000);
		
	}, 150);
}

function stopConfetti() {
	if (confettiInterval) {
		clearInterval(confettiInterval);
		confettiInterval = null;
	}
	const container = document.getElementById('confetti-container');
	if (container) {
		container.innerHTML = '';
		container.style.display = 'none';
	}
}

// Sallanma efekti sınıf desteği
const styleNode = document.createElement('style');
styleNode.innerHTML = `
	.shake-anim {
		animation: shake 0.5s ease-in-out;
	}
`;
document.head.appendChild(styleNode);

// ==========================================================================
// SEKMELER ARASI GEÇİŞ (VIEW SWITCHING) & SİPARİŞ MANTIĞI
// ==========================================================================

let currentFilter = 'all';
let currentSearchQuery = '';
let orderCodeToCancel = null;

// Örnek Sipariş Veri Kümesi
let orders = [
	{
		code: '#1024',
		customer: 'Kerem Yılmaz',
		city: 'İstanbul',
		payment: 'card',
		date: '23 Mayıs 2026, 11:30',
		status: 'preparing',
		phone: '+90 532 123 4567',
		email: 'kerem@example.com',
		address: 'Kadıköy Mahallesi, Moda Caddesi No:12 D:4, İstanbul',
		carrier: 'Yurtiçi Kargo',
		tracking: 'YT1293848123',
		total: 3700.00,
		products: [
			{ name: 'Wireless Ergonomik Mouse', qty: 1, price: '₺1,200.00' },
			{ name: 'RGB Mekanik Klavye', qty: 1, price: '₺2,500.00' }
		]
	},
	{
		code: '#1023',
		customer: 'Aysun Demir',
		city: 'Ankara',
		payment: 'cod',
		date: '23 Mayıs 2026, 09:15',
		status: 'ready',
		phone: '+90 544 987 6543',
		email: 'aysun@example.com',
		address: 'Çankaya Mahallesi, Tunalı Hilmi Caddesi No:85, Ankara',
		carrier: 'MNG Kargo',
		tracking: 'MN94810239',
		total: 850.00,
		products: [
			{ name: 'Deri Laptop Kılıfı 15.6"', qty: 1, price: '₺850.00' }
		]
	},
	{
		code: '#1022',
		customer: 'Murat Şahin',
		city: 'İzmir',
		payment: 'card',
		date: '22 Mayıs 2026, 17:45',
		status: 'shipped',
		phone: '+90 555 456 7890',
		email: 'murat@example.com',
		address: 'Karşıyaka, Cemal Gürsel Caddesi No:210, İzmir',
		carrier: 'Aras Kargo',
		tracking: 'AR984129841',
		total: 1400.00,
		products: [
			{ name: 'USB-C Hub Adaptör 7 in 1', qty: 2, price: '₺1,400.00' }
		]
	},
	{
		code: '#1021',
		customer: 'Elif Kaya',
		city: 'Bursa',
		payment: 'card',
		date: '22 Mayıs 2026, 14:20',
		status: 'preparing',
		phone: '+90 533 111 2233',
		email: 'elif@example.com',
		address: 'Nilüfer, Fatih Sultan Mehmet Bulvarı No:45, Bursa',
		carrier: 'Sürat Kargo',
		tracking: 'SR481928410',
		total: 3100.00,
		products: [
			{ name: 'Kablosuz Kulak Üstü Kulaklık', qty: 1, price: '₺3,100.00' }
		]
	},
	{
		code: '#1020',
		customer: 'Can Özkan',
		city: 'Antalya',
		payment: 'cod',
		date: '21 Mayıs 2026, 10:05',
		status: 'shipped',
		phone: '+90 507 555 6677',
		email: 'can@example.com',
		address: 'Muratpaşa, Lara Caddesi No:305, Antalya',
		carrier: 'Yurtiçi Kargo',
		tracking: 'YT984102931',
		total: 4200.00,
		products: [
			{ name: 'Akıllı Saat Active Pro', qty: 1, price: '₺4,200.00' }
		]
	},
	{
		code: '#1019',
		customer: 'Hale Soygazi',
		city: 'Yalova',
		payment: 'card',
		date: '20 Mayıs 2026, 15:40',
		status: 'returned',
		phone: '+90 532 999 8877',
		email: 'hale@example.com',
		address: 'Yalova Merkez, Hürriyet Cad. No:5',
		carrier: 'Aras Kargo',
		tracking: 'AR984129845',
		total: 1250.00,
		products: [
			{ name: 'Deri Laptop Kılıfı 15.6"', qty: 1, price: '₺1,250.00' }
		]
	},
	{
		code: '#1018',
		customer: 'Ferit Aslan',
		city: 'İstanbul',
		payment: 'cod',
		date: '19 Mayıs 2026, 11:20',
		status: 'returned',
		phone: '+90 541 222 3344',
		email: 'ferit@example.com',
		address: 'Beşiktaş, Barbaros Bulvarı No:90',
		carrier: 'Yurtiçi Kargo',
		tracking: 'YT491028374',
		total: 1400.00,
		products: [
			{ name: 'USB-C Hub Adaptör 7 in 1', qty: 1, price: '₺1,400.00' }
		]
	},
	{
		code: '#1017',
		customer: 'Selin Şen',
		city: 'Ankara',
		payment: 'card',
		date: '18 Mayıs 2026, 16:30',
		status: 'returned',
		phone: '+90 553 444 5566',
		email: 'selin@example.com',
		address: 'Etimesgut, İstasyon Cad. No:120',
		carrier: 'MNG Kargo',
		tracking: 'MN94810235',
		total: 3100.00,
		products: [
			{ name: 'Kablosuz Kulak Üstü Kulaklık', qty: 1, price: '₺3,100.00' }
		]
	}
];

// ==========================================================================
// DİNAMİK GRAFİK BİLEŞENLERİ (CHART.JS)
// ==========================================================================
let ciroChartInst = null;
let channelsChartInst = null;

function initCharts() {
	const ciroCtx = document.getElementById('ciroChart');
	const channelsCtx = document.getElementById('channelsChart');
	
	if (!ciroCtx || !channelsCtx) return;
	if (typeof Chart === 'undefined') {
		console.warn('Chart.js kütüphanesi henüz yüklenmedi.');
		return;
	}

	// Overlapping önlemek için eski grafikleri yok et
	if (ciroChartInst) ciroChartInst.destroy();
	if (channelsChartInst) channelsChartInst.destroy();

	// Line Chart: Sipariş & Ciro Dağılımı
	ciroChartInst = new Chart(ciroCtx.getContext('2d'), {
		type: 'line',
		data: {
			labels: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'],
			datasets: [
				{
					label: 'Ciro (₺)',
					data: [5400, 7200, 4800, 8900, 6200, 9500, 7800],
					borderColor: '#10b981',
					backgroundColor: 'rgba(16, 185, 129, 0.04)',
					borderWidth: 3,
					fill: true,
					tension: 0.4,
					pointBackgroundColor: '#10b981',
					pointBorderColor: '#ffffff',
					pointBorderWidth: 2,
					pointRadius: 4,
					pointHoverRadius: 7
				},
				{
					label: 'Sipariş (Adet)',
					data: [8, 12, 6, 15, 10, 18, 13],
					borderColor: '#3b82f6',
					backgroundColor: 'transparent',
					borderWidth: 2,
					tension: 0.4,
					pointBackgroundColor: '#3b82f6',
					pointBorderColor: '#ffffff',
					pointBorderWidth: 2,
					pointRadius: 4,
					pointHoverRadius: 6,
					yAxisID: 'y1'
				}
			]
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: {
					position: 'top',
					labels: {
						font: { family: 'Plus Jakarta Sans', weight: '700', size: 12 },
						color: '#475569',
						boxWidth: 14
					}
				},
				tooltip: {
					padding: 12,
					backgroundColor: 'rgba(255, 255, 255, 0.95)',
					titleColor: '#1e293b',
					bodyColor: '#475569',
					borderColor: 'rgba(0, 0, 0, 0.06)',
					borderWidth: 1,
					titleFont: { family: 'Outfit', weight: '700', size: 13 },
					bodyFont: { family: 'Plus Jakarta Sans', size: 12 },
					boxPadding: 6,
					usePointStyle: true
				}
			},
			scales: {
				x: {
					grid: { display: false },
					ticks: { color: '#475569', font: { family: 'Plus Jakarta Sans', size: 11 } }
				},
				y: {
					type: 'linear',
					display: true,
					position: 'left',
					grid: { color: 'rgba(0, 0, 0, 0.05)' },
					ticks: { color: '#475569', font: { family: 'Plus Jakarta Sans', size: 11 } }
				},
				y1: {
					type: 'linear',
					display: true,
					position: 'right',
					grid: { drawOnChartArea: false },
					ticks: { color: '#475569', font: { family: 'Plus Jakarta Sans', size: 11 } }
				}
			}
		}
	});

	// Doughnut Chart: Sipariş Kanalları
	channelsChartInst = new Chart(channelsCtx.getContext('2d'), {
		type: 'doughnut',
		data: {
			labels: ['Shopify', 'Manuel', 'Excel'],
			datasets: [{
				data: [65, 20, 15],
				backgroundColor: [
					'rgba(16, 185, 129, 0.85)',
					'rgba(59, 130, 246, 0.85)',
					'rgba(245, 158, 11, 0.85)'
				],
				borderColor: '#ffffff',
				borderWidth: 2,
				hoverOffset: 6
			}]
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: {
					position: 'bottom',
					labels: {
						font: { family: 'Plus Jakarta Sans', weight: '600', size: 11 },
						color: '#475569',
						boxWidth: 10,
						padding: 10
					}
				},
				tooltip: {
					backgroundColor: 'rgba(255, 255, 255, 0.95)',
					titleColor: '#1e293b',
					bodyColor: '#475569',
					borderColor: 'rgba(0, 0, 0, 0.06)',
					borderWidth: 1,
					bodyFont: { family: 'Plus Jakarta Sans' }
				}
			},
			cutout: '70%'
		}
	});
}

// Menü Geçişleri ve Olay Dinleyicileri
function initNavigation() {
	const menuItems = {
		'nav-dashboard': 'dashboard',
		'nav-connect': 'connect',
		'nav-orders': 'orders',
		'nav-verification': 'verification',
		'nav-products': 'products',
		'nav-send-to-warehouse': 'send-to-warehouse',
		'nav-wallet': 'wallet',
		'nav-sms': 'sms',
		'nav-address-book': 'address-book',
		'nav-support': 'support',
		'nav-reports': 'reports',
		'nav-settings': 'settings'
	};

	// Diğer menüler için dost canlısı bildirim göster
	const otherMenus = [];
	otherMenus.forEach(id => {
		const el = document.getElementById(id);
		if (el) {
			// Temiz dinleyici ekle
			const newEl = el.cloneNode(true);
			el.parentNode.replaceChild(newEl, el);
			newEl.addEventListener('click', (e) => {
				e.preventDefault();
				alert('Bu bölüm entegrasyon aşamasındadır. Şu an Siparişlerim, Ürünlerim, Cüzdan, Destek ve Dashboard sekmelerini inceleyebilirsiniz.');
			});
		}
	});

	// Dashboard ve Sipariş geçişleri
	Object.keys(menuItems).forEach(id => {
		const el = document.getElementById(id);
		if (el) {
			const newEl = el.cloneNode(true);
			el.parentNode.replaceChild(newEl, el);
			newEl.addEventListener('click', (e) => {
				e.preventDefault();
				switchView(menuItems[id]);
			});
		}
	});
}

function toggleMobileSidebar() {
	const sidebar = document.querySelector('.sidebar');
	const overlay = document.getElementById('sidebar-overlay');
	if (sidebar && overlay) {
		sidebar.classList.toggle('mobile-active');
		overlay.classList.toggle('active');
	}
}

function switchView(viewName) {
	// Sayfa yenilemelerinde aktif sayfayı korumak için kaydet
	localStorage.setItem('nestro_current_view', viewName);

	const dashboardView = document.getElementById('dashboard-view');
	const connectView = document.getElementById('connect-view');
	const ordersView = document.getElementById('orders-view');
	const productsView = document.getElementById('products-view');
	const walletView = document.getElementById('wallet-view');
	const supportView = document.getElementById('support-view');
	const smsView = document.getElementById('sms-view');
	const addressBookView = document.getElementById('address-book-view');
	const reportsView = document.getElementById('reports-view');
	const settingsView = document.getElementById('settings-view');
	const verificationView = document.getElementById('verification-view');
	const sendToWarehouseView = document.getElementById('send-to-warehouse-view');
	
	const navDashboard = document.getElementById('nav-dashboard');
	const navConnect = document.getElementById('nav-connect');
	const navOrders = document.getElementById('nav-orders');
	const navProducts = document.getElementById('nav-products');
	const navSendToWarehouse = document.getElementById('nav-send-to-warehouse');
	const navWallet = document.getElementById('nav-wallet');
	const navSupport = document.getElementById('nav-support');
	const navSms = document.getElementById('nav-sms');
	const navAddressBook = document.getElementById('nav-address-book');
	const navReports = document.getElementById('nav-reports');
	const navSettings = document.getElementById('nav-settings');
	const navVerification = document.getElementById('nav-verification');

	if (!dashboardView || !connectView || !ordersView || !productsView || !walletView || !supportView || !smsView || !addressBookView || !reportsView || !settingsView || !verificationView || !sendToWarehouseView) return;

	// Mobil sidebar'ı kapat (eğer aktifse)
	const sidebar = document.querySelector('.sidebar');
	const overlay = document.getElementById('sidebar-overlay');
	if (sidebar && sidebar.classList.contains('mobile-active')) {
		sidebar.classList.remove('mobile-active');
		if (overlay) overlay.classList.remove('active');
	}

	// Aktif menü vurgulamalarını kaldır
	navDashboard.classList.remove('active');
	if (navConnect) navConnect.classList.remove('active');
	navOrders.classList.remove('active');
	if (navVerification) navVerification.classList.remove('active');
	if (navProducts) navProducts.classList.remove('active');
	if (navSendToWarehouse) navSendToWarehouse.classList.remove('active');
	if (navWallet) navWallet.classList.remove('active');
	if (navSupport) navSupport.classList.remove('active');
	if (navSms) navSms.classList.remove('active');
	if (navAddressBook) navAddressBook.classList.remove('active');
	if (navReports) navReports.classList.remove('active');
	if (navSettings) navSettings.classList.remove('active');

	// Tümünü gizle
	dashboardView.style.display = 'none';
	connectView.style.display = 'none';
	ordersView.style.display = 'none';
	productsView.style.display = 'none';
	walletView.style.display = 'none';
	supportView.style.display = 'none';
	smsView.style.display = 'none';
	addressBookView.style.display = 'none';
	reportsView.style.display = 'none';
	settingsView.style.display = 'none';
	verificationView.style.display = 'none';
	sendToWarehouseView.style.display = 'none';

	// İlgili görünümü aç
	if (viewName === 'dashboard') {
		dashboardView.style.display = 'block';
		navDashboard.classList.add('active');
		setTimeout(initCharts, 50); // DOM render süresi için kısa gecikme
	} else if (viewName === 'connect') {
		connectView.style.display = 'block';
		if (navConnect) navConnect.classList.add('active');
	} else if (viewName === 'orders') {
		ordersView.style.display = 'block';
		navOrders.classList.add('active');
		// Siparişleri yeniden çiz (güncel verilerle)
		renderOrders(currentFilter, currentSearchQuery);
		// Yeni Sipariş Kodu alanını güncelle
		updateNextOrderCodeField();
	} else if (viewName === 'products') {
		productsView.style.display = 'block';
		if (navProducts) navProducts.classList.add('active');
		renderProducts();
	} else if (viewName === 'wallet') {
		walletView.style.display = 'block';
		if (navWallet) navWallet.classList.add('active');
		renderTransactions();
		updateBalanceDisplay();
	} else if (viewName === 'support') {
		supportView.style.display = 'block';
		if (navSupport) navSupport.classList.add('active');
		renderTickets();
	} else if (viewName === 'sms') {
		smsView.style.display = 'block';
		if (navSms) navSms.classList.add('active');
		initSmsView();
	} else if (viewName === 'address-book') {
		addressBookView.style.display = 'block';
		if (navAddressBook) navAddressBook.classList.add('active');
		initAddressBookView();
	} else if (viewName === 'reports') {
		reportsView.style.display = 'block';
		if (navReports) navReports.classList.add('active');
		renderReportTransactions();
	} else if (viewName === 'settings') {
		settingsView.style.display = 'block';
		if (navSettings) navSettings.classList.add('active');
	} else if (viewName === 'verification') {
		verificationView.style.display = 'block';
		if (navVerification) navVerification.classList.add('active');
		initVerificationView();
	} else if (viewName === 'send-to-warehouse') {
		sendToWarehouseView.style.display = 'block';
		if (navSendToWarehouse) navSendToWarehouse.classList.add('active');
		setServiceType('return');
	}
}

// Sipariş Rozet ve Durum Çevirileri
function getStatusBadge(status) {
	if (status === 'preparing') {
		return `<span class="status-pill preparing"><i class="fa-solid fa-clock"></i> Hazırlanıyor</span>`;
	} else if (status === 'ready') {
		return `<span class="status-pill ready"><i class="fa-solid fa-spinner fa-spin-slow"></i> Hazırlandı</span>`;
	} else if (status === 'shipped') {
		return `<span class="status-pill shipped"><i class="fa-solid fa-truck-fast"></i> Kargoya Verildi</span>`;
	}
	return status;
}

// Siparişleri Render Et
function renderOrders(filter = 'all', searchQuery = '') {
	currentFilter = filter;
	currentSearchQuery = searchQuery;

	const tbody = document.getElementById('orders-tbody-new');
	const tableWrapper = document.getElementById('orders-table-wrapper');
	const emptyState = document.getElementById('orders-empty-state');
	
	if (!tbody) return;

	// Siparişleri süz
	let filteredOrders = orders;

	// Tab Filtreleri (card, cod, cancelled, returned)
	if (filter === 'card') {
		filteredOrders = filteredOrders.filter(o => o.payment === 'card' && o.status !== 'cancelled' && o.status !== 'returned');
	} else if (filter === 'cod') {
		filteredOrders = filteredOrders.filter(o => o.payment === 'cod' && o.status !== 'cancelled' && o.status !== 'returned');
	} else if (filter === 'cancelled') {
		filteredOrders = filteredOrders.filter(o => o.status === 'cancelled');
	} else if (filter === 'returned') {
		filteredOrders = filteredOrders.filter(o => o.status === 'returned');
	}

	// Arama süzgeci (Sipariş Kodu, Müşteri Adı, Şehir)
	if (searchQuery) {
		const query = searchQuery.toLowerCase();
		filteredOrders = filteredOrders.filter(o => 
			o.code.toLowerCase().includes(query) || 
			o.customer.toLowerCase().includes(query) ||
			(o.city && o.city.toLowerCase().includes(query))
		);
	}

	// Boş durum kontrolü
	if (filteredOrders.length === 0) {
		if (tableWrapper) tableWrapper.style.display = 'none';
		if (emptyState) emptyState.style.display = 'flex';
		tbody.innerHTML = '';
		return;
	}

	if (tableWrapper) tableWrapper.style.display = 'table';
	if (emptyState) emptyState.style.display = 'none';

	tbody.innerHTML = '';
	filteredOrders.forEach(order => {
		const tr = document.createElement('tr');
		
		// Ödeme Yöntemi Badge
		let paymentBadge = '';
		if (order.payment === 'card') {
			paymentBadge = `<span class="badge-payment card"><i class="fa-solid fa-credit-card"></i> Kredi Kartı</span>`;
		} else {
			paymentBadge = `<span class="badge-payment cod"><i class="fa-solid fa-hand-holding-dollar"></i> Kapıda Ödeme</span>`;
		}
		
		// Durum Rozeti
		let statusBadge = '';
		if (order.status === 'preparing') {
			statusBadge = `<span class="status-pill preparing"><i class="fa-solid fa-clock"></i> Hazırlanıyor</span>`;
		} else if (order.status === 'ready') {
			statusBadge = `<span class="status-pill ready"><i class="fa-solid fa-spinner fa-spin-slow"></i> Hazırlandı</span>`;
		} else if (order.status === 'shipped') {
			statusBadge = `<span class="status-pill shipped"><i class="fa-solid fa-truck-fast"></i> Kargoya Verildi</span>`;
		} else if (order.status === 'cancelled') {
			statusBadge = `<span class="status-pill cancelled"><i class="fa-solid fa-ban"></i> İptal Edildi</span>`;
		} else if (order.status === 'returned') {
			statusBadge = `<span class="status-pill returned-pending"><i class="fa-solid fa-rotate-left"></i> İade Edildi</span>`;
		}
		
		// İptal Et butonu sadece Kargoya Verildi (shipped), İade Edildi (returned) ve İptal Edildi değilse gösterilir
		const showCancel = order.status !== 'shipped' && order.status !== 'cancelled' && order.status !== 'returned';
		const cancelBtnHTML = showCancel 
			? `<button class="btn-action-cancel" onclick="openCancelModal('${order.code}')"><i class="fa-solid fa-ban"></i> İptal</button>` 
			: '';

		const totalFormatted = '₺' + order.total.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
		const cityText = order.city ? ` (${escapeHTML(order.city)})` : '';

		tr.innerHTML = `
			<td class="ledger-code-style">${escapeHTML(order.code)}</td>
			<td>${escapeHTML(order.date.split(',')[0])}</td>
			<td><strong>${escapeHTML(order.customer)}</strong><span style="font-size: 12px; color: var(--text-muted);">${cityText}</span></td>
			<td>${paymentBadge}</td>
			<td>${statusBadge}</td>
			<td class="align-right" style="font-weight: 700; color: var(--text-primary);">${totalFormatted}</td>
			<td style="text-align: right; padding-right: 20px;">
				<div style="display: flex; justify-content: flex-end; align-items: center; gap: 6px;">
					<button class="btn-action-detail" onclick="openDetailModal('${order.code}')"><i class="fa-solid fa-circle-info"></i> Detay</button>
					${cancelBtnHTML}
				</div>
			</td>
		`;
		tbody.appendChild(tr);
	});

	// Alt Göstergeleri (Sub-Dashboard) Güncelle
	updateOrdersSubDashboard();
}

// Filtre Değiştir (Geriye dönük uyumluluk için)
function filterOrders(filterType) {
	// Yeni sisteme yönlendir
	const mapping = {
		'all': 'all',
		'preparing': 'all',
		'ready': 'all',
		'shipped': 'all'
	};
	filterOrdersNew(mapping[filterType] || 'all');
}

// Yeni Filtreleme Tab Tetikleyicisi
function filterOrdersNew(filterType) {
	currentFilter = filterType;

	const tabs = {
		'all': 'tab-orders-all',
		'card': 'tab-orders-paid',
		'cod': 'tab-orders-cod',
		'cancelled': 'tab-orders-cancelled',
		'returned': 'tab-orders-returned'
	};

	Object.keys(tabs).forEach(key => {
		const btn = document.getElementById(tabs[key]);
		if (btn) {
			if (key === filterType) {
				btn.classList.add('active');
			} else {
				btn.classList.remove('active');
			}
		}
	});

	renderOrders(filterType, currentSearchQuery);
}

// Siparişlerde Yerel Arama
function handleLocalOrderSearch() {
	const searchInput = document.getElementById('orders-local-search');
	if (searchInput) {
		currentSearchQuery = searchInput.value.trim();
		renderOrders(currentFilter, currentSearchQuery);
	}
}

// Sipariş Alt Göstergelerini Güncelleme
function updateOrdersSubDashboard() {
	const statPaid = document.getElementById('orders-stat-paid');
	const statCod = document.getElementById('orders-stat-cod');
	const statCancelled = document.getElementById('orders-stat-cancelled');
	const statReturned = document.getElementById('orders-stat-returned');

	if (!statPaid || !statCod || !statCancelled) return;

	const paidCount = orders.filter(o => o.payment === 'card' && o.status !== 'cancelled' && o.status !== 'returned').length;
	const codCount = orders.filter(o => o.payment === 'cod' && o.status !== 'cancelled' && o.status !== 'returned').length;
	const cancelledCount = orders.filter(o => o.status === 'cancelled').length;
	const returnedCount = orders.filter(o => o.status === 'returned').length;

	statPaid.textContent = paidCount;
	statCod.textContent = codCount;
	statCancelled.textContent = cancelledCount;
	if (statReturned) statReturned.textContent = returnedCount;
}

// Detay Modalı Aç/Kapat
function openDetailModal(code) {
	const order = orders.find(o => o.code === code);
	if (!order) return;

	document.getElementById('detail-order-code').textContent = order.code;
	document.getElementById('detail-customer-name').textContent = order.customer;
	document.getElementById('detail-customer-phone').textContent = order.phone;
	document.getElementById('detail-customer-email').textContent = order.email;
	document.getElementById('detail-customer-address').textContent = order.address;
	document.getElementById('detail-shipping-carrier').textContent = order.carrier;
	document.getElementById('detail-shipping-tracking').textContent = order.tracking || 'Henüz atanmadı';

	// Durum Badge
	const statusBadge = document.getElementById('detail-order-status');
	statusBadge.className = 'status-badge-inline';
	if (order.status === 'preparing') {
		statusBadge.classList.add('preparing');
		statusBadge.textContent = 'Hazırlanıyor';
	} else if (order.status === 'ready') {
	} else if (order.status === 'shipped') {
		statusBadge.classList.add('shipped');
		statusBadge.textContent = 'Kargoya Verildi';
	} else if (order.status === 'cancelled') {
		statusBadge.classList.add('cancelled');
		statusBadge.textContent = 'İptal Edildi';
	}

	// Ürünler
	const productsList = document.getElementById('detail-products-list');
	productsList.innerHTML = '';
	order.products.forEach(p => {
		const row = document.createElement('div');
		row.className = 'product-item-row';
		row.innerHTML = `
			<span class="qty-name">${p.qty}x ${escapeHTML(p.name)}</span>
			<span class="price">${p.price}</span>
		`;
		productsList.appendChild(row);
	});

	document.getElementById('order-detail-modal').style.display = 'flex';
}

function closeDetailModal() {
	closeModalWithAnimation('order-detail-modal');
}

// İptal Modalı Aç/Kapat
function openCancelModal(code) {
	orderCodeToCancel = code;
	document.getElementById('cancel-order-code').textContent = code;
	document.getElementById('order-cancel-modal').style.display = 'flex';
}

function closeCancelModal() {
	closeModalWithAnimation('order-cancel-modal', () => {
		const reasonInput = document.getElementById('cancel-reason-input');
		if (reasonInput) reasonInput.value = '';
		orderCodeToCancel = null;
	});
}

// İptal İşlemini Onayla
function confirmCancelOrder() {
	if (!orderCodeToCancel) return;

	const reasonInput = document.getElementById('cancel-reason-input');
	const reason = reasonInput ? reasonInput.value.trim() : '';
	if (!reason) {
		showNotification('Lütfen müşteriye gönderilecek iptal açıklamasını yazın.', 'error');
		if (reasonInput) reasonInput.focus();
		return;
	}

	// Sipariş durumunu güncelle
	const order = orders.find(o => o.code === orderCodeToCancel);
	if (order) {
		order.status = 'cancelled';
	}

	// Sipariş kartlarını ve dashboard istatistiklerini güncelle
	renderOrders(currentFilter, currentSearchQuery);
	updateDashboardStats();

	closeCancelModal();

	// Başarılı iptal bildirisi (Toast ile)
	showNotification(`Sipariş ${orderCodeToCancel} başarıyla iptal edildi ve müşteriye bilgi e-postası gönderildi.`, 'success');
}

// İptal Sonrası Dashboard Kart İstatistiklerini Güncelleme
function updateDashboardStats() {
	// İstatistikleri hesapla
	const pendingCount = orders.filter(o => o.status === 'preparing').length;
	const readyCount = orders.filter(o => o.status === 'ready').length;
	const shippedCount = orders.filter(o => o.status === 'shipped').length;

	// DOM elemanlarını bul ve güncelle
	const pendingCard = document.querySelector('.status-card.pending .card-value');
	const processingCard = document.querySelector('.status-card.processing .card-value');
	const shippedCard = document.querySelector('.status-card.shipped .card-value');

	if (pendingCard) pendingCard.textContent = pendingCount;
	if (processingCard) processingCard.textContent = readyCount;
	if (shippedCard) shippedCard.textContent = shippedCount;

	// Üst karşılama mesajındaki sipariş sayısını da güncelle
	const welcomeHeader = document.querySelector('.header-welcome h1');
	if (welcomeHeader) {
		const totalToday = pendingCount + readyCount + shippedCount;
		const username = localStorage.getItem('nestro_username') || 'Kullanıcı';
		welcomeHeader.innerHTML = `Bugün ${totalToday} yeni siparişin var, Merhaba <span id="username-display">${username}</span> 👋`;
	}

	// Eğer dashboard'da filtreli sipariş tablosu açıksa onu da güncelle
	if (typeof currentDashboardFilter !== 'undefined' && currentDashboardFilter) {
		filterDashboardOrders(currentDashboardFilter, false);
	}
}

// ==========================================================================
// TOAST NOTIFICATION SYSTEM & DRAFT ORDER CREATION
// ==========================================================================

// Global Toast Notification Engine
function showNotification(message, type = 'success') {
	const container = document.getElementById('toast-container');
	if (!container) return;

	const toast = document.createElement('div');
	toast.className = `toast-notification`;
	if (type === 'error') {
		toast.style.borderLeftColor = '#dc3545';
	}
	
	const icon = type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation';
	const iconColor = type === 'success' ? '#28a745' : '#dc3545';
	
	toast.innerHTML = `
		<i class="fa-solid ${icon}" style="color: ${iconColor}; font-size: 18px;"></i>
		<div style="flex-grow: 1; line-height: 1.4;">${escapeHTML(message)}</div>
	`;
	
	container.appendChild(toast);
	
	// Trigger animation
	setTimeout(() => {
		toast.classList.add('show');
	}, 10);
	
	// Remove after 3 seconds
	setTimeout(() => {
		toast.classList.add('hide');
		setTimeout(() => {
			toast.remove();
		}, 400);
	}, 3000);
}

// Otomatik Sipariş Kodu Artırma Mantığı
function getNextOrderCode() {
	let maxNum = 1000;
	orders.forEach(o => {
		const numPart = parseInt(o.code.replace('#', ''), 10);
		if (!isNaN(numPart) && numPart > maxNum) {
			maxNum = numPart;
		}
	});
	return `#${maxNum + 1}`;
}

function updateNextOrderCodeField() {
	const codeInput = document.getElementById('draft-order-code');
	if (codeInput) {
		codeInput.value = getNextOrderCode();
	}
}

// Taslak Sipariş Modalı Aç/Kapat
function openDraftOrderModal() {
	const modal = document.getElementById('draft-order-modal');
	if (modal) {
		modal.style.display = 'flex';
		updateNextOrderCodeField();
	}
}

function closeDraftOrderModal() {
	closeModalWithAnimation('draft-order-modal');
}

// Taslak Sipariş Oluşturma Olayı
function handleCreateDraftOrder(e) {
	e.preventDefault();
	
	const customerInput = document.getElementById('draft-customer-name');
	const productInput = document.getElementById('draft-product-name');
	const phoneInput = document.getElementById('draft-customer-phone');
	const paymentTypeInput = document.getElementById('draft-payment-type');
	const addressInput = document.getElementById('draft-customer-address');
	
	if (!customerInput || !productInput || !phoneInput || !paymentTypeInput || !addressInput) return;
	
	const customer = customerInput.value.trim();
	const product = productInput.value.trim();
	const phone = phoneInput.value.trim();
	const paymentType = paymentTypeInput.value;
	const address = addressInput.value.trim();
	
	if (!customer || !product || !phone || !address) return;
	
	// Kargo firmasını modal seçeneğinden al
	const carrierInput = document.getElementById('draft-carrier-select');
	const selectedCarrier = carrierInput ? carrierInput.value : 'Yurtiçi Kargo';

	// Adresten ili ayıklamaya çalış (veya varsayılan olarak İstanbul set et)
	let city = 'İstanbul';
	const addressLower = address.toLowerCase();
	if (addressLower.includes('ankara')) city = 'Ankara';
	else if (addressLower.includes('izmir')) city = 'İzmir';
	else if (addressLower.includes('bursa')) city = 'Bursa';
	else if (addressLower.includes('antalya')) city = 'Antalya';
	else if (addressLower.includes('adana')) city = 'Adana';
	
	const randomPrice = Math.floor(Math.random() * 2000) + 500;
	const paymentMapped = paymentType === 'paid' ? 'card' : 'cod';

	const nextCode = getNextOrderCode();
	const now = new Date();
	const dateStr = now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) + ', ' + now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
	
	// Yeni sipariş verisi
	const newOrder = {
		code: nextCode,
		customer: customer,
		city: city,
		payment: paymentMapped,
		date: dateStr,
		status: 'preparing',
		phone: phone,
		email: customer.toLowerCase().replace(/\s+/g, '') + '@example.com',
		address: address,
		carrier: selectedCarrier,
		tracking: '',
		total: randomPrice,
		products: [
			{ name: product, qty: 1, price: '₺' + randomPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) }
		]
	};
	
	// Siparişi listenin başına ekle
	orders.unshift(newOrder);
	
	// Formu sıfırla
	const modalForm = document.getElementById('modal-draft-order-form');
	if (modalForm) modalForm.reset();
	
	// Modalı Kapat
	closeDraftOrderModal();
	
	// Arayüzü güncelle
	renderOrders(currentFilter, currentSearchQuery);
	updateDashboardStats();
	updateNextOrderCodeField();
	
	// Başarı Toast Bildirisi
	showNotification(`Başarılı: ${nextCode} numaralı siparişi oluşturdunuz.`, 'success');
}

// ==========================================================================
// WAREHOUSE STOK VE ENVANTER (PRODUCTS / WMS) MANTIĞI
// ==========================================================================

// Örnek Ürün Veri Kümesi (8 Adet Ürün)
let products = [
	{ id: 'p-1', name: 'Nestro Klasik Pamuklu T-Shirt - Siyah', sku: 'NST-TSH-BLK-S', stock: 120, category: 'Underbros', assignedUser: 'emin çeri', status: 'Aktif', returned: 3, shelf: 'A-12', photo: '' },
	{ id: 'p-2', name: 'Nestro Klasik Pamuklu T-Shirt - Beyaz', sku: 'NST-TSH-WHT-M', stock: 8, category: 'Underbros', assignedUser: 'emin çeri', status: 'Aktif', returned: 1, shelf: 'A-13', photo: '' },
	{ id: 'p-3', name: 'Premium Wireless Kulaklık (Gürültü Önleyici)', sku: 'NST-EAR-ANC-01', stock: 45, category: 'Underbros', assignedUser: 'emin çeri', status: 'Aktif', returned: 0, shelf: 'B-04', photo: '' },
	{ id: 'p-4', name: 'Ultra İnce Laptop Kılıfı 13"', sku: 'NST-LAP-SLV-13', stock: 5, category: 'Underbros', assignedUser: 'emin çeri', status: 'Aktif', returned: 2, shelf: 'C-08', photo: '' },
	{ id: 'p-5', name: 'Ergonomik Jel Mouse Pad', sku: 'NST-PAD-GEL-02', stock: 85, category: 'Underbros', assignedUser: 'emin çeri', status: 'Aktif', returned: 4, shelf: 'B-15', photo: '' },
	{ id: 'p-6', name: 'USB-C Çoklu Dağıtıcı Hub (6 in 1)', sku: 'NST-HUB-USBC-6', stock: 2, category: 'Underbros', assignedUser: 'emin çeri', status: 'Aktif', returned: 0, shelf: 'C-12', photo: '' },
	{ id: 'p-7', name: 'Akıllı Ev Termostatı (Dokunmatik)', sku: 'NST-THR-SMT-99', stock: 14, category: 'Underbros', assignedUser: 'emin çeri', status: 'Aktif', returned: 1, shelf: 'D-02', photo: '' },
	{ id: 'p-8', name: 'Minimalist Deri Kartlık Cüzdan', sku: 'NST-WLT-MIN-03', stock: 60, category: 'Underbros', assignedUser: 'emin çeri', status: 'Aktif', returned: 5, shelf: 'B-22', photo: '' }
];

// Ürün Listesini Render Et
function renderProducts() {
	const tbody = document.getElementById('products-list-tbody');
	if (!tbody) return;

	tbody.innerHTML = '';
	
	// Ürün sayısını dinamik güncelle
	const countText = document.getElementById('product-count-text');
	if (countText) {
		countText.textContent = `${products.length} ürün gösteriliyor`;
	}

	products.forEach(product => {
		const tr = document.createElement('tr');
		tr.setAttribute('id', `row-${product.id}`);

		// Kritik Stok Kontrolü & Stok Rozeti Tasarımı (Görsel 2 gibi)
		const isLowStock = product.stock < 10;
		
		let stockBadgeHTML = '';
		if (isLowStock) {
			stockBadgeHTML = `
				<div style="display: inline-flex; align-items: center; gap: 8px;">
					<span style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); color: #d97706; padding: 6px 12px; border-radius: 20px; font-weight: 700; font-size: 12.5px;">${product.stock} adet</span>
					<span style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: #ef4444; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
						<i class="fa-solid fa-triangle-exclamation"></i> Kritik Stok
					</span>
				</div>
			`;
		} else {
			stockBadgeHTML = `
				<span style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: #10b981; padding: 6px 12px; border-radius: 20px; font-weight: 700; font-size: 12.5px;">${product.stock} adet</span>
			`;
		}

		// Durum Rozeti (Görsel 2 gibi)
		const statusHTML = `<span style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: #10b981; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 700;">Aktif</span>`;

		// Kategori ve Atanan Kullanıcı
		const category = product.category || 'Underbros';
		const assignedUser = product.assignedUser || 'emin çeri';

		tr.innerHTML = `
			<td class="col-checkbox" style="text-align: center; padding: 18px 12px;">
				<input type="checkbox" class="product-select-chk" value="${product.id}" onchange="checkSelectAllState()">
			</td>
			<td>
				<div style="font-weight: 700; color: var(--text-primary); font-size: 13.5px; text-align: left;">${escapeHTML(product.name)}</div>
			</td>
			<td>
				<div style="font-family: monospace; font-size: 13px; color: var(--text-secondary); font-weight: 600; text-align: left;">${escapeHTML(product.sku)}</div>
			</td>
			<td>
				<div style="display: flex; justify-content: flex-start;">${stockBadgeHTML}</div>
			</td>
			<td>
				<div style="font-weight: 600; color: var(--text-secondary); font-size: 13px; text-align: left;">${escapeHTML(category)}</div>
			</td>
			<td>
				<div style="font-weight: 600; color: var(--text-secondary); font-size: 13px; text-align: left;">${escapeHTML(assignedUser)}</div>
			</td>
			<td>
				<div style="display: flex; justify-content: flex-start;">${statusHTML}</div>
			</td>
		`;
		tbody.appendChild(tr);
	});
}

// Seçim Modu Değişimi
function toggleSelectionMode(checkbox) {
	const productsView = document.getElementById('products-view');
	const btnGetRecords = document.getElementById('btn-get-stock-records');
	
	if (!productsView || !btnGetRecords) return;
	
	if (checkbox.checked) {
		productsView.classList.add('selection-active');
		btnGetRecords.style.display = 'inline-flex';
	} else {
		productsView.classList.remove('selection-active');
		btnGetRecords.style.display = 'none';
		
		// Tüm seçilmişleri temizle
		const chks = document.querySelectorAll('.product-select-chk');
		chks.forEach(c => c.checked = false);
		const selectAll = document.getElementById('select-all-products');
		if (selectAll) selectAll.checked = false;
	}
}

// Tümünü Seç Olayı
function toggleSelectAllProducts(headerCheckbox) {
	const chks = document.querySelectorAll('.product-select-chk');
	chks.forEach(c => {
		c.checked = headerCheckbox.checked;
	});
}

// Checkbox'ların Seçim Durumuna Göre Üst Seçimi Ayarla
function checkSelectAllState() {
	const allChks = document.querySelectorAll('.product-select-chk');
	const checkedChks = document.querySelectorAll('.product-select-chk:checked');
	const selectAll = document.getElementById('select-all-products');
	if (selectAll && allChks.length > 0) {
		selectAll.checked = (allChks.length === checkedChks.length);
	}
}

// Geçmiş Kayıtlar Kümesi (localStorage'dan oku)
let stockRecordsHistory = JSON.parse(localStorage.getItem('nestro_stock_records_history')) || [];

// Seçilen Ürünlerin Stok Kayıtlarını Al
function handleGetStockRecords() {
	const chks = document.querySelectorAll('.product-select-chk:checked');
	if (chks.length === 0) {
		showNotification('Lütfen en az bir ürün seçiniz.', 'error');
		return;
	}
	
	const selectedItems = [];
	let totalStock = 0;
	
	chks.forEach(chk => {
		const productId = chk.value;
		const product = products.find(p => p.id === productId);
		if (product) {
			selectedItems.push({
				id: product.id,
				name: product.name,
				sku: product.sku,
				stock: product.stock
			});
			totalStock += product.stock;
		}
	});
	
	const reportCode = 'SR-' + Math.floor(100000 + Math.random() * 900000);
	
	const now = new Date();
	const dateStr = now.toLocaleString('tr-TR', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit'
	});
	
	const newRecord = {
		id: reportCode,
		date: dateStr,
		count: selectedItems.length,
		totalStock: totalStock,
		items: selectedItems
	};
	
	stockRecordsHistory.unshift(newRecord);
	localStorage.setItem('nestro_stock_records_history', JSON.stringify(stockRecordsHistory));
	
	renderStockRecordsHistory();
	showNotification(`Stok kayıtları başarıyla alındı! Rapor Kodu: ${reportCode}`, 'success');
	
	// Temizle
	const allChks = document.querySelectorAll('.product-select-chk');
	allChks.forEach(c => c.checked = false);
	const selectAll = document.getElementById('select-all-products');
	if (selectAll) selectAll.checked = false;
}

// Geçmiş Raporları Tabloya Ekle
function renderStockRecordsHistory() {
	const tbody = document.getElementById('stock-records-history-tbody');
	if (!tbody) return;
	
	tbody.innerHTML = '';
	
	if (stockRecordsHistory.length === 0) {
		tbody.innerHTML = `
			<tr>
				<td colspan="5" style="text-align: center; color: var(--text-muted); padding: 24px;">Henüz kaydedilmiş stok raporu bulunmamaktadır.</td>
			</tr>
		`;
		return;
	}
	
	stockRecordsHistory.forEach(record => {
		const tr = document.createElement('tr');
		tr.innerHTML = `
			<td>
				<div style="font-weight: 600; color: var(--text-primary); text-align: left;">${escapeHTML(record.date)}</div>
			</td>
			<td>
				<div style="font-family: monospace; font-weight: 700; color: var(--text-secondary); text-align: left;">${escapeHTML(record.id)}</div>
			</td>
			<td>
				<div style="font-weight: 600; color: var(--text-secondary); text-align: left;">${record.count} ürün</div>
			</td>
			<td>
				<div style="display: flex; justify-content: flex-start;">
					<span style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: #10b981; padding: 4px 10px; border-radius: 20px; font-weight: 700; font-size: 12px;">${record.totalStock} adet</span>
				</div>
			</td>
			<td style="text-align: right; padding-right: 24px;">
				<button class="btn-secondary" style="padding: 6px 12px; font-size: 12px; margin: 0;" onclick="viewStockRecordDetail('${record.id}')">
					<i class="fa-solid fa-eye"></i> Detay Göster
				</button>
			</td>
		`;
		tbody.appendChild(tr);
	});
}

// Detay Penceresi Aç
function viewStockRecordDetail(recordId) {
	const record = stockRecordsHistory.find(r => r.id === recordId);
	if (!record) return;
	
	document.getElementById('record-detail-code').textContent = record.id;
	document.getElementById('record-detail-date').textContent = record.date;
	
	const tbody = document.getElementById('record-detail-tbody');
	if (tbody) {
		tbody.innerHTML = '';
		record.items.forEach(item => {
			const tr = document.createElement('tr');
			tr.innerHTML = `
				<td style="padding: 10px 14px; font-weight: 600; color: var(--text-primary); text-align: left;">${escapeHTML(item.name)}</td>
				<td style="padding: 10px 14px; font-family: monospace; font-size: 12px; color: var(--text-secondary); text-align: left;">${escapeHTML(item.sku)}</td>
				<td style="padding: 10px 14px; text-align: right; font-weight: 700; color: var(--text-primary);">${item.stock} adet</td>
			`;
			tbody.appendChild(tr);
		});
	}
	
	const modal = document.getElementById('stock-record-detail-modal');
	if (modal) {
		modal.style.display = 'flex';
	}
}

// Detay Modalı Kapat
function closeStockRecordDetailModal() {
	closeModalWithAnimation('stock-record-detail-modal');
}

// Rapor Geçmişini Temizle
function clearStockRecordsHistory() {
	if (confirm('Geçmiş tüm stok rapor kayıtlarını silmek istediğinizden emin misiniz?')) {
		stockRecordsHistory = [];
		localStorage.removeItem('nestro_stock_records_history');
		renderStockRecordsHistory();
		showNotification('Stok rapor geçmişi temizlendi.', 'success');
	}
}

// Ürün Silme Olayı
function handleDeleteProduct(id) {
	const product = products.find(p => p.id === id);
	if (!product) return;

	const row = document.getElementById(`row-${id}`);
	if (row) {
		row.classList.add('product-row-fadeout');
		setTimeout(() => {
			products = products.filter(p => p.id !== id);
			renderProducts();
			showNotification(`"${product.name}" katalogdan başarıyla silindi.`, 'success');
		}, 400);
	}
}

// Stoğa Ekleme Olayı (Modal Açma)
let productIdToRestock = null;

function handleRestockProduct(id) {
	const product = products.find(p => p.id === id);
	if (!product) return;

	productIdToRestock = id;

	// Modal içi ürün bilgisini yerleştir
	const infoBox = document.getElementById('restock-product-info-box');
	if (infoBox) {
		infoBox.innerHTML = `
			<strong>Ürün Adı:</strong> ${escapeHTML(product.name)} <br>
			<strong>SKU Kodu:</strong> ${escapeHTML(product.sku)} <br>
			<strong>Mevcut Stok:</strong> ${product.stock} adet
		`;
	}

	document.getElementById('modal-restock-product').style.display = 'flex';
}

function closeRestockModal() {
	closeModalWithAnimation('modal-restock-product', () => {
		document.getElementById('restock-product-form').reset();
		productIdToRestock = null;
	});
}

function submitRestockProduct(e) {
	e.preventDefault();

	if (!productIdToRestock) return;

	const amountInput = document.getElementById('restock-amount-input');
	if (!amountInput) return;

	const count = parseInt(amountInput.value, 10);
	if (isNaN(count) || count <= 0) {
		showNotification('Lütfen geçerli ve pozitif bir adet girin.', 'error');
		return;
	}

	const product = products.find(p => p.id === productIdToRestock);
	if (product) {
		product.stock += count;
		renderProducts();
		showNotification('Stok başarıyla güncellendi.', 'success');
	}

	closeRestockModal();
}

// Yeni Ürün Ekleme (Modal Açma)
function handleAddProductPrompt() {
	document.getElementById('modal-add-product').style.display = 'flex';
}

function closeAddProductModal() {
	closeModalWithAnimation('modal-add-product', () => {
		document.getElementById('add-product-form').reset();
	});
}

function submitAddProduct(e) {
	e.preventDefault();

	const nameInput = document.getElementById('product-name-input');
	const skuInput = document.getElementById('product-sku-input');
	const stockInput = document.getElementById('product-stock-input');
	const shelfInput = document.getElementById('product-shelf-input');

	if (!nameInput || !skuInput || !stockInput || !shelfInput) return;

	const nameVal = nameInput.value.trim();
	const skuVal = skuInput.value.trim().toUpperCase();
	const stockVal = parseInt(stockInput.value, 10);
	const shelfVal = shelfInput.value.trim().toUpperCase();

	if (!nameVal || !skuVal || isNaN(stockVal) || stockVal < 0 || !shelfVal) {
		showNotification('Lütfen tüm alanları geçerli şekilde doldurun.', 'error');
		return;
	}

	const newProduct = {
		id: 'p-' + Date.now(),
		name: nameVal,
		sku: skuVal,
		stock: stockVal,
		returned: 0,
		shelf: shelfVal,
		photo: ''
	};

	products.unshift(newProduct);
	renderProducts();

	closeAddProductModal();
	showNotification('Yeni ürün başarıyla eklendi.', 'success');
}

// ==========================================================================
// CÜZDAN, BAKİYE HAREKETLERİ VE ÖDEME (WALLET & BILLING) MANTIĞI
// ==========================================================================

// Örnek Bakiye ve İşlem Geçmişi
let currentBalance = 4250.00;
let transactions = [
	{ id: 't-1', date: '23 Mayıs 2026, 10:45', desc: 'Sürat Kargo Gönderim Ücreti (#1022)', amount: -140.00, status: 'completed' },
	{ id: 't-2', date: '23 Mayıs 2026, 09:30', desc: 'Kredi Kartı Bakiye Yüklemesi', amount: 2000.00, status: 'completed' },
	{ id: 't-3', date: '22 Mayıs 2026, 16:15', desc: 'Yurtiçi Kargo Gönderim Ücreti (#1020)', amount: -95.00, status: 'completed' },
	{ id: 't-4', date: '21 Mayıs 2026, 14:00', desc: 'Aras Kargo Gönderim Ücreti (#1019)', amount: -110.00, status: 'completed' },
	{ id: 't-5', date: '20 Mayıs 2026, 11:20', desc: 'Kredi Kartı Bakiye Yüklemesi', amount: 1000.00, status: 'completed' }
];

// İşlem Geçmişini Render Et
function renderTransactions() {
	const tbody = document.getElementById('transactions-list-tbody');
	if (!tbody) return;

	tbody.innerHTML = '';
	transactions.forEach(t => {
		const tr = document.createElement('tr');
		
		const amountClass = t.amount < 0 ? 'trans-amount deduction' : 'trans-amount addition';
		const amountSign = t.amount < 0 ? '-' : '+';
		const absAmount = Math.abs(t.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
		
		const statusBadge = t.status === 'completed' 
			? `<span class="badge-status-completed"><i class="fa-solid fa-check"></i> Tamamlandı</span>`
			: `<span class="badge-status-pending"><i class="fa-solid fa-spinner fa-spin-slow"></i> Beklemede</span>`;

		tr.innerHTML = `
			<td>${escapeHTML(t.date)}</td>
			<td><strong>${escapeHTML(t.desc)}</strong></td>
			<td class="${amountClass}">${amountSign} ₺${absAmount}</td>
			<td>${statusBadge}</td>
		`;
		tbody.appendChild(tr);
	});
}

// Bakiye Metnini Güncelle
function updateBalanceDisplay() {
	const balanceEl = document.getElementById('wallet-balance-val');
	if (balanceEl) {
		balanceEl.textContent = '₺' + currentBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	}
}

// Modalları Aç/Kapat
function openDepositModal() {
	document.getElementById('wallet-deposit-modal').style.display = 'flex';
}

// Formu temizle ve Kapat
function closeDepositModal() {
	document.getElementById('wallet-deposit-modal').style.display = 'none';
	document.getElementById('deposit-amount-input').value = '';
	document.getElementById('deposit-card-form').reset();
}

function openWithdrawModal() {
	document.getElementById('wallet-withdraw-modal').style.display = 'flex';
}

function closeWithdrawModal() {
	document.getElementById('wallet-withdraw-modal').style.display = 'none';
	document.getElementById('withdraw-amount-input').value = '';
	document.getElementById('withdraw-funds-form').reset();
}

// Hızlı Tutar Seçimi
function selectDepositAmount(amount) {
	const input = document.getElementById('deposit-amount-input');
	if (input) {
		input.value = amount;
	}
}

// Bakiye Yükleme Gönderimi (Form)
function handleDepositSubmit(e) {
	e.preventDefault();
	
	const amountInput = document.getElementById('deposit-amount-input');
	if (!amountInput) return;
	
	const amount = parseFloat(amountInput.value);
	if (isNaN(amount) || amount <= 0) {
		showNotification('Lütfen geçerli bir yükleme tutarı girin.', 'error');
		return;
	}

	// Kart bilgilerini de basitçe doğrula (güvenlik hissi için)
	const cardName = document.getElementById('card-name-input').value.trim();
	const cardNumber = document.getElementById('card-number-input').value.replace(/\s/g, '');
	const cardExpiry = document.getElementById('card-expiry-input').value.trim();
	const cardCvv = document.getElementById('card-cvv-input').value.trim();

	if (!cardName || cardNumber.length < 16 || !cardExpiry || cardCvv.length < 3) {
		showNotification('Lütfen kart bilgilerini eksiksiz doldurun.', 'error');
		return;
	}

	// Bakiyeyi yükselt
	currentBalance += amount;
	updateBalanceDisplay();

	// İşlem geçmişine kaydet
	const now = new Date();
	const dateStr = now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) + ', ' + now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
	
	const newTrans = {
		id: 't-' + Date.now(),
		date: dateStr,
		desc: 'Kredi Kartı Bakiye Yüklemesi',
		amount: amount,
		status: 'completed'
	};
	transactions.unshift(newTrans);

	renderTransactions();
	closeDepositModal();

	// Başarı Toast'u fırlat
	showNotification(`Başarılı: Hesabınıza ₺${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} bakiye yüklendi.`, 'success');
}

// Para Çekme Gönderimi (Form)
function handleWithdrawSubmit(e) {
	e.preventDefault();
	
	const amountInput = document.getElementById('withdraw-amount-input');
	if (!amountInput) return;
	
	const amount = parseFloat(amountInput.value);
	if (isNaN(amount) || amount <= 0) {
		showNotification('Lütfen geçerli bir çekim tutarı girin.', 'error');
		return;
	}

	if (amount > currentBalance) {
		showNotification('Çekmek istediğiniz tutar mevcut bakiyenizden yüksek olamaz.', 'error');
		return;
	}

	const ibanSelect = document.getElementById('withdraw-iban-select');
	const selectedIbanText = ibanSelect ? ibanSelect.options[ibanSelect.selectedIndex].text : '';
	const bankName = selectedIbanText.split(' - ')[1] || 'Banka Hesabı';

	// Bakiyeyi düşür
	currentBalance -= amount;
	updateBalanceDisplay();

	// İşlem geçmişine kaydet (Durum: beklemede / pending)
	const now = new Date();
	const dateStr = now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) + ', ' + now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
	
	const newTrans = {
		id: 't-' + Date.now(),
		date: dateStr,
		desc: `Banka Çekim Talebi (${bankName})`,
		amount: -amount,
		status: 'pending' // Beklemede rozeti gösterimi için
	};
	transactions.unshift(newTrans);

	renderTransactions();
	closeWithdrawModal();

	// Başarı Toast'u fırlat
	showNotification(`Çekim talebiniz alındı. ₺${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} en kısa sürede hesabınıza aktarılacaktır.`, 'success');
}

// Otomatik Bakiye Yükleme Toggle Değişimi
function handleAutoTopupToggle(toggle) {
	const status = toggle.checked ? 'aktif edildi' : 'devre dışı bırakıldı';
	showNotification(`Otomatik bakiye yükleme ${status}.`, 'success');
}

// ==========================================================================
// DESTEK TICKET SİSTEMİ & AI CANLI SOHBET (SUPPORT & AI CHATBOT) MANTIĞI
// ==========================================================================

// Örnek Destek Talepleri Veri Kümesi
let tickets = [
	{ id: 'DST-901', subject: 'Kargo Takip Kodu Senkronizasyon Hatası', date: '23 Mayıs 2026, 10:20', status: 'answered' },
	{ id: 'DST-892', subject: 'Cüzdan Para Çekme Limitleri Hk.', date: '21 Mayıs 2026, 15:40', status: 'closed' },
	{ id: 'DST-854', subject: '#1015 Numaralı Siparişte Yanlış Ürün Eşleşmesi', date: '18 Mayıs 2026, 09:15', status: 'closed' },
	{ id: 'DST-811', subject: 'SMS Entegrasyonu Başlık Onayı', date: '15 Mayıs 2026, 11:30', status: 'closed' }
];

// Destek Taleplerini Render Et
function renderTickets() {
	const tbody = document.getElementById('tickets-list-tbody');
	if (!tbody) return;

	tbody.innerHTML = '';
	tickets.forEach(ticket => {
		const tr = document.createElement('tr');
		
		let statusBadgeHTML = '';
		if (ticket.status === 'answered') {
			statusBadgeHTML = `<span class="badge-ticket-answered"><i class="fa-solid fa-circle-check"></i> Yanıtlandı</span>`;
		} else if (ticket.status === 'open') {
			statusBadgeHTML = `<span class="badge-ticket-open"><i class="fa-solid fa-envelope-open"></i> Açık</span>`;
		} else if (ticket.status === 'closed') {
			statusBadgeHTML = `<span class="badge-ticket-closed"><i class="fa-solid fa-folder-closed"></i> Kapalı</span>`;
		}

		tr.innerHTML = `
			<td><strong>#${escapeHTML(ticket.id)}</strong></td>
			<td>${escapeHTML(ticket.subject)}</td>
			<td>${escapeHTML(ticket.date)}</td>
			<td>${statusBadgeHTML}</td>
		`;
		tbody.appendChild(tr);
	});
}

// Yeni Talep Oluşturma (Modal Açma)
function handleCreateTicketPrompt() {
	document.getElementById('modal-support-ticket').style.display = 'flex';
}

function closeSupportTicketModal() {
	document.getElementById('modal-support-ticket').style.display = 'none';
	document.getElementById('support-ticket-form').reset();
}

function submitSupportTicket(e) {
	e.preventDefault();

	const subjectSelect = document.getElementById('ticket-subject-select');
	const orderInput = document.getElementById('ticket-order-input');
	const messageTextarea = document.getElementById('ticket-message-textarea');

	if (!subjectSelect || !messageTextarea) return;

	const subjectVal = subjectSelect.value;
	const orderVal = orderInput ? orderInput.value.trim() : '';
	const messageVal = messageTextarea.value.trim();

	if (!messageVal) {
		showNotification('Lütfen mesajınızı yazın.', 'error');
		return;
	}

	const newId = 'DST-' + (Math.floor(Math.random() * 900) + 100);
	const now = new Date();
	const dateStr = now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) + ', ' + now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

	const subjectText = orderVal ? `${subjectVal} (Sipariş: ${orderVal})` : subjectVal;

	const newTicket = {
		id: newId,
		subject: subjectText,
		date: dateStr,
		status: 'open'
	};

	tickets.unshift(newTicket);
	renderTickets();

	closeSupportTicketModal();
	showNotification('Talebiniz destek ekibine iletildi.', 'success');
}

// AI Chatbot Değişkenleri
let chatbotState = 0;
let currentOrderNumber = '';
let chatbotOpenedFirstTime = false;

// Chatbot Göster/Gizle Yardımcı Fonksiyonları
function showChatbot() {
	const chatbotWrapper = document.querySelector('.chatbot-floating-wrapper');
	if (chatbotWrapper) {
		chatbotWrapper.style.display = 'block';
	}
}

function hideChatbot() {
	const chatbotWrapper = document.querySelector('.chatbot-floating-wrapper');
	if (chatbotWrapper) {
		chatbotWrapper.style.display = 'none';
		// Açık olan chat penceresini de kapat
		const windowEl = document.getElementById('chatbot-window');
		if (windowEl) {
			windowEl.classList.remove('active');
		}
	}
}

// Chat Penceresini Aç/Kapa
function toggleChatWindow() {
	const windowEl = document.getElementById('chatbot-window');
	if (!windowEl) return;
	
	const isActive = windowEl.classList.toggle('active');
	
	// Yüzen butonun bildirim dotunu temizle
	const dot = document.querySelector('.chatbot-toggle-btn .chat-badge-dot');
	if (dot) dot.style.display = 'none';

	if (isActive && !chatbotOpenedFirstTime) {
		chatbotOpenedFirstTime = true;
		chatbotState = 1; // Sipariş numarası bekleme modu
		triggerBotTypingAndReply("Hoş geldin! Nestro AI Canlı Destek asistanına bağlandın. Sana nasıl yardımcı olabilirim? İşlem yapmak istediğin 4 haneli Sipariş Kodunu yazar mısın? (Örn: 1024)");
	}
}

// Bot "Yazıyor..." Efekti ve Mesaj Gönderimi
function triggerBotTypingAndReply(message, delay = 800, callback = null) {
	const messagesContainer = document.getElementById('chatbot-messages');
	if (!messagesContainer) return;

	// Yazıyor (Typing) Göstergesi Ekle
	const typingIndicator = document.createElement('div');
	typingIndicator.className = 'typing-indicator';
	typingIndicator.id = 'bot-typing';
	typingIndicator.innerHTML = '<span></span><span></span><span></span>';
	messagesContainer.appendChild(typingIndicator);
	messagesContainer.scrollTop = messagesContainer.scrollHeight;

	setTimeout(() => {
		// Yazıyor Göstergesini Temizle
		const indicator = document.getElementById('bot-typing');
		if (indicator) indicator.remove();

		// Gerçek Mesaj Balonunu Ekle
		const bubble = document.createElement('div');
		bubble.className = 'chat-bubble bot';
		bubble.innerHTML = message;
		messagesContainer.appendChild(bubble);
		messagesContainer.scrollTop = messagesContainer.scrollHeight;

		if (callback) callback();
	}, delay);
}

// Kullanıcı Mesaj Gönderme Handler'ı
function handleSendChatMessage(e) {
	e.preventDefault();
	
	const inputEl = document.getElementById('chatbot-message-input');
	if (!inputEl) return;
	
	const message = inputEl.value.trim();
	if (!message) return;

	inputEl.value = '';

	// Kullanıcı balonu ekle
	appendUserMessage(message);

	// Bot yanıt motorunu çalıştır
	processBotResponse(message);
}

function appendUserMessage(message) {
	const messagesContainer = document.getElementById('chatbot-messages');
	if (!messagesContainer) return;

	const bubble = document.createElement('div');
	bubble.className = 'chat-bubble user';
	bubble.textContent = message;
	messagesContainer.appendChild(bubble);
	messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// AI Asistan Durum Makinesi (State Machine)
function processBotResponse(userMsg) {
	if (chatbotState === 1) {
		// Kullanıcıdan Sipariş Kodu Bekleniyor
		const match = userMsg.match(/\d+/);
		if (match) {
			currentOrderNumber = match[0];
			chatbotState = 2; // Seçenek Tıklama Bekleniyor
			
			triggerBotTypingAndReply(`Teşekkürler. #${currentOrderNumber} numaralı sipariş için ne yapmak istiyorsun?`, 1000, () => {
				// Hızlı Cevap Butonlarını Yerleştir
				renderQuickReplies();
			});
		} else {
			triggerBotTypingAndReply("Lütfen geçerli bir sipariş kodu yazar mısın? (Örn: #1024 yazabilirsin veya doğrudan 1024)");
		}
	} else if (chatbotState === 2) {
		triggerBotTypingAndReply("Lütfen aşağıdaki seçeneklerden birini tıklayarak devam et.");
	} else {
		// Resetleyip Başa Dön
		triggerBotTypingAndReply("Sana başka bir sipariş hakkında yardımcı olabilir miyim? Lütfen sorgulamak istediğin sipariş kodunu yazar mısın? (Örn: 1024)");
		chatbotState = 1;
	}
}

// Hızlı Cevap Butonlarını Render Et
function renderQuickReplies() {
	const messagesContainer = document.getElementById('chatbot-messages');
	if (!messagesContainer) return;

	const replyBox = document.createElement('div');
	replyBox.className = 'quick-replies-container';
	replyBox.id = 'active-quick-replies';

	const options = [
		{ text: 'Ürün Değişikliği', value: 'urun' },
		{ text: 'Adres Değişikliği', value: 'adres' },
		{ text: 'Aciliyet Bildir', value: 'aciliyet' }
	];

	options.forEach(opt => {
		const btn = document.createElement('button');
		btn.className = 'btn-quick-reply';
		btn.textContent = opt.text;
		btn.onclick = () => handleQuickReplyClick(opt.text, opt.value);
		replyBox.appendChild(btn);
	});

	messagesContainer.appendChild(replyBox);
	messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Hızlı Cevap Tıklama Handler'ı
function handleQuickReplyClick(text, value) {
	// Aktif buton kutusunu sil
	const replyBox = document.getElementById('active-quick-replies');
	if (replyBox) replyBox.remove();

	// Tıklanan metni kullanıcı balonu olarak ekle
	appendUserMessage(text);

	chatbotState = 3; // Çözüldü

	if (value === 'aciliyet') {
		triggerBotTypingAndReply("İşleminiz alındı. Depoya aciliyet bildirildi! Siparişin en kısa sürede hazırlanıp kargoya verilecektir. 🚀", 1200, () => {
			askAnythingElse();
		});
	} else {
		triggerBotTypingAndReply("Talebiniz destek ekibine iletildi. İlgili sipariş için en kısa sürede sizinle iletişime geçeceğiz. 🤝", 1200, () => {
			askAnythingElse();
		});
	}
}

function askAnythingElse() {
	setTimeout(() => {
		triggerBotTypingAndReply("Sana başka bir sipariş için yardımcı olmamı ister misin? Sipariş kodunu yazar mısın? 😊");
		chatbotState = 1;
	}, 1500);
}

// ==========================================================================
// MAĞAZA BAĞLAMA (CONNECT STORE) FORM & URL DOĞRULAMA MANTIĞI
// ==========================================================================

// Shopify Mağaza Adı Otomatik Düzeltme (blur olayı tetiklendiğinde)
function validateAndFormatStoreUrl(input) {
	let val = input.value.trim().toLowerCase();
	if (!val) return;

	// Protokolleri (http://, https://) ve www. öneklerini temizle
	val = val.replace(/^(https?:\/\/)?(www\.)?/, '');

	// URL'nin sonundaki yolları veya query parametrelerini temizle (örn. magaza.myshopify.com/admin -> magaza.myshopify.com)
	val = val.split('/')[0];

	if (val) {
		if (!val.endsWith('.myshopify.com')) {
			// Eğer kullanıcı farklı bir uzantı girdiyse (örn. magaza.com) sadece ilk kelimeyi alıp .myshopify.com ekle
			const parts = val.split('.');
			if (parts.length > 1) {
				val = parts[0] + '.myshopify.com';
			} else {
				val = val + '.myshopify.com';
			}
		}
	}

	input.value = val;
}

// E-Ticaret Platformları API Alan Yapılandırmaları
const platformFields = {
	shopify: [
		{ id: 'store-url', label: 'Shopify Mağaza Adresi (URL)', type: 'text', placeholder: 'Örn: dukkanadi.myshopify.com', required: true },
		{ id: 'api-token', label: 'Admin API Erişim Jetonu (Access Token)', type: 'password', placeholder: 'shpat_...', required: true }
	],
	woocommerce: [
		{ id: 'store-url', label: 'WooCommerce Site Adresi (URL)', type: 'text', placeholder: 'Örn: https://siteniz.com', required: true },
		{ id: 'api-key', label: 'Tüketici Anahtarı (Consumer Key)', type: 'password', placeholder: 'ck_...', required: true },
		{ id: 'api-secret', label: 'Gizli Anahtar (Consumer Secret)', type: 'password', placeholder: 'cs_...', required: true }
	],
	ikas: [
		{ id: 'api-key', label: 'API Anahtarı (API Key)', type: 'text', placeholder: 'Ikas API Anahtarınız', required: true },
		{ id: 'api-secret', label: 'API Gizli Anahtarı (API Secret)', type: 'password', placeholder: 'Ikas API Secret', required: true }
	],
	ticimax: [
		{ id: 'api-key', label: 'API Anahtarı (API Key)', type: 'text', placeholder: 'Ticimax API Anahtarınız', required: true },
		{ id: 'api-secret', label: 'API Gizli Anahtarı (API Secret)', type: 'password', placeholder: 'Ticimax API Secret', required: true }
	],
	ideasoft: [
		{ id: 'api-key', label: 'API Anahtarı (API Key)', type: 'text', placeholder: 'IdeaSoft API Anahtarınız', required: true },
		{ id: 'api-secret', label: 'API Gizli Anahtarı (API Secret)', type: 'password', placeholder: 'IdeaSoft API Secret', required: true }
	],
	trendyol: [
		{ id: 'seller-id', label: 'Satıcı ID (Seller ID)', type: 'text', placeholder: 'Trendyol Satıcı ID\'niz', required: true },
		{ id: 'api-key', label: 'API Anahtarı (API Key)', type: 'text', placeholder: 'Trendyol API Key', required: true },
		{ id: 'api-secret', label: 'API Gizli Anahtarı (API Secret)', type: 'password', placeholder: 'Trendyol API Secret', required: true }
	],
	hepsiburada: [
		{ id: 'seller-id', label: 'Satıcı ID (Seller ID)', type: 'text', placeholder: 'Hepsiburada Satıcı ID\'niz (Merchant ID)', required: true },
		{ id: 'api-key', label: 'API Anahtarı (API Key)', type: 'text', placeholder: 'Hepsiburada API Key', required: true },
		{ id: 'api-secret', label: 'API Gizli Anahtarı (API Secret)', type: 'password', placeholder: 'Hepsiburada API Secret', required: true }
	]
};

// Dinamik Bağlantı Modalı Aç
function openConnectModal(platform) {
	const modal = document.getElementById('store-connect-modal');
	const modalTitle = document.getElementById('connect-modal-title');
	const modalBody = document.getElementById('connect-modal-body');
	const hiddenPlatform = document.getElementById('connect-selected-platform');
	
	if (!modal || !modalBody || !hiddenPlatform) return;
	
	const fields = platformFields[platform];
	if (!fields) return;
	
	const platformNames = {
		shopify: 'Shopify Mağazasını Bağla',
		woocommerce: 'WooCommerce Mağazasını Bağla',
		ikas: 'Ikas Mağazasını Bağla',
		ticimax: 'Ticimax Mağazasını Bağla',
		ideasoft: 'IdeaSoft Mağazasını Bağla',
		trendyol: 'Trendyol Mağazasını Bağla',
		hepsiburada: 'Hepsiburada Mağazasını Bağla'
	};
	
	if (modalTitle) {
		modalTitle.textContent = platformNames[platform] || 'Mağaza Bağla';
	}
	
	hiddenPlatform.value = platform;
	modalBody.innerHTML = '';
	
	// Alanları dinamik oluştur
	fields.forEach(field => {
		const formGroup = document.createElement('div');
		formGroup.className = 'form-group-draft';
		formGroup.style.marginBottom = '16px';
		
		const label = document.createElement('label');
		label.setAttribute('for', `connect-field-${field.id}`);
		label.textContent = field.label;
		label.style.fontWeight = '600';
		label.style.display = 'block';
		label.style.marginBottom = '6px';
		label.style.color = 'var(--text-secondary)';
		label.style.fontSize = '13px';
		
		const input = document.createElement('input');
		input.type = field.type;
		input.id = `connect-field-${field.id}`;
		input.placeholder = field.placeholder;
		input.required = field.required;
		input.style.width = '100%';
		input.style.padding = '10px 14px';
		input.style.border = '1px solid var(--border-color)';
		input.style.borderRadius = 'var(--radius-md)';
		input.style.fontSize = '13.5px';
		input.style.fontFamily = 'var(--font-main)';
		input.style.outline = 'none';
		input.style.transition = 'var(--transition-smooth)';
		
		input.addEventListener('focus', () => {
			input.style.borderColor = 'rgba(40, 167, 69, 0.4)';
			input.style.boxShadow = '0 0 0 3px rgba(40, 167, 69, 0.1)';
		});
		input.addEventListener('blur', () => {
			input.style.borderColor = 'var(--border-color)';
			input.style.boxShadow = 'none';
		});
		
		formGroup.appendChild(label);
		formGroup.appendChild(input);
		modalBody.appendChild(formGroup);
	});
	
	modal.style.display = 'flex';
}

// Modalı Kapat
function closeConnectModal() {
	closeModalWithAnimation('store-connect-modal', () => {
		const form = document.getElementById('store-credentials-form');
		if (form) form.reset();
	});
}

// Bağlantıyı Sına & Kaydet Formu Gönderildiğinde
function handleStoreConnectSubmit(e) {
	e.preventDefault();
	
	const platform = document.getElementById('connect-selected-platform').value;
	const submitBtn = document.getElementById('btn-test-connect');
	const btnText = document.getElementById('btn-test-connect-text');
	
	if (!platform || !submitBtn || !btnText) return;
	
	// Basit API doğrulama kontrolleri
	if (platform === 'shopify') {
		const tokenInput = document.getElementById('connect-field-api-token');
		if (tokenInput && !tokenInput.value.startsWith('shpat_')) {
			showNotification('Hata: Admin API Erişim Jetonu "shpat_" ile başlamalıdır.', 'error');
			tokenInput.focus();
			return;
		}
	} else if (platform === 'woocommerce') {
		const keyInput = document.getElementById('connect-field-api-key');
		const secretInput = document.getElementById('connect-field-api-secret');
		if (keyInput && !keyInput.value.startsWith('ck_')) {
			showNotification('Hata: WooCommerce Consumer Key "ck_" ile başlamalıdır.', 'error');
			keyInput.focus();
			return;
		}
		if (secretInput && !secretInput.value.startsWith('cs_')) {
			showNotification('Hata: WooCommerce Consumer Secret "cs_" ile başlamalıdır.', 'error');
			secretInput.focus();
			return;
		}
	}
	
	// Yükleniyor durumunu simüle et
	submitBtn.disabled = true;
	btnText.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Bağlantı Sınanıyor...';
	
	setTimeout(() => {
		// Bağlı mağazaları localStorage'a kaydet
		let connectedStores = {};
		try {
			connectedStores = JSON.parse(localStorage.getItem('nestro_connected_stores') || '{}');
		} catch (err) {
			connectedStores = {};
		}
		
		connectedStores[platform] = true;
		localStorage.setItem('nestro_connected_stores', JSON.stringify(connectedStores));
		
		// Izgara kartını güncelle
		updatePlatformCardConnected(platform);
		
		const platformNames = {
			shopify: 'Shopify',
			woocommerce: 'WooCommerce',
			ikas: 'Ikas',
			ticimax: 'Ticimax',
			ideasoft: 'IdeaSoft',
			trendyol: 'Trendyol',
			hepsiburada: 'Hepsiburada'
		};
		const pName = platformNames[platform] || platform;
		showNotification(`${pName} mağazanız başarıyla entegre edildi ve siparişleriniz çekilmeye başlandı.`, 'success');
		
		// Modalı kapat
		closeConnectModal();
		
		// Butonu sıfırla
		submitBtn.disabled = false;
		btnText.textContent = 'Bağlantıyı Sına & Kaydet';
		
		// Eğer ilk mağaza ise envanter kurulumunu tamamla ve Dashboard'a yönlendir
		const isSetupCompleted = localStorage.getItem('nestro_setup_completed');
		if (isSetupCompleted !== 'true') {
			localStorage.setItem('nestro_setup_completed', 'true');
			switchView('dashboard');
		}
	}, 2000);
}

// localStorage'daki Mağaza Durumlarını Yükle
function initConnectedStores() {
	let connectedStores = {};
	try {
		connectedStores = JSON.parse(localStorage.getItem('nestro_connected_stores') || '{}');
	} catch (err) {
		connectedStores = {};
	}
	
	Object.keys(connectedStores).forEach(platform => {
		if (connectedStores[platform]) {
			updatePlatformCardConnected(platform);
		}
	});
}

// Kartı "Bağlı" Olarak İşaretle
function updatePlatformCardConnected(platform) {
	const card = document.querySelector(`.store-card.${platform}`);
	const statusEl = document.getElementById(`status-${platform}`);
	
	if (card) {
		card.classList.add('connected');
	}
	if (statusEl) {
		statusEl.textContent = 'Bağlı';
	}
}

// ==========================================================================
// 15. SMS AYARLARI (SMS SETTINGS) MANTIĞI & CÜZDAN ENTEGRASYONU
// ==========================================================================

let smsBalance = 450;
let selectedSmsPackageData = { id: 'pkg-500', price: 200, amount: 500 };
const defaultSmsTemplate = "Sayın [Müşteri Adı], [Sipariş No] numaralı ve [Tutar] tutarındaki kapıda ödeme siparişinizi onaylamak için linke tıklayın: [Onay Linki]";

// SMS Sekmesi İlk Yükleme
function initSmsView() {
	const textarea = document.getElementById('sms-template-textarea');
	if (textarea && !textarea.value) {
		textarea.value = defaultSmsTemplate;
	}
	// SMS bakiyesini istatistik kartına bas
	const statVal = document.getElementById('sms-balance-stat');
	if (statVal) {
		statVal.textContent = smsBalance;
	}
	updateSmsLivePreview();
}

// Canlı Önizleme Güncelleme & Karakter Sayacı
function updateSmsLivePreview() {
	const textarea = document.getElementById('sms-template-textarea');
	const previewBubble = document.getElementById('sms-preview-bubble-text');
	const counter = document.getElementById('sms-char-counter');
	
	if (!textarea || !previewBubble) return;
	
	const templateText = textarea.value;
	
	// Karakter ve SMS Sayısı Hesaplama
	const charCount = templateText.length;
	// Standart SMS 160 karakterdir
	const smsCount = Math.ceil(charCount / 160) || 1;
	
	if (counter) {
		counter.textContent = `${charCount} Karakter (${smsCount} SMS)`;
	}
	
	// Dinamik Değişkenleri Değiştirme
	let formattedText = templateText
		.replace(/\[Müşteri Adı\]/g, "Ahmet Yılmaz")
		.replace(/\[Sipariş No\]/g, "#10293")
		.replace(/\[Tutar\]/g, "450 TL")
		.replace(/\[Onay Linki\]/g, "nestro.link/ab12");
		
	previewBubble.textContent = formattedText || "SMS şablonu boş.";
}

// İmleç Konumuna Değişken Ekleme (UX Tasarımı)
function insertVariable(tag) {
	const textarea = document.getElementById('sms-template-textarea');
	if (!textarea) return;
	
	const start = textarea.selectionStart;
	const end = textarea.selectionEnd;
	const text = textarea.value;
	
	const before = text.substring(0, start);
	const after = text.substring(end, text.length);
	
	textarea.value = before + tag + after;
	
	// İmleci eklenen tag'in sonuna konumlandır
	const newCursorPos = start + tag.length;
	textarea.selectionStart = newCursorPos;
	textarea.selectionEnd = newCursorPos;
	
	textarea.focus();
	updateSmsLivePreview();
}

// Şablon Kaydetme Olayı
function saveSmsTemplate() {
	const textarea = document.getElementById('sms-template-textarea');
	if (!textarea || !textarea.value.trim()) {
		showNotification("SMS şablonu boş olamaz.", "error");
		return;
	}
	showNotification("SMS Şablonu başarıyla kaydedildi.", "success");
}

// Otomasyon Tetikleyici Değişimi
function handleSmsRuleChange(toggle, ruleName) {
	const status = toggle.checked ? "aktif edildi" : "devre dışı bırakıldı";
	showNotification(`${ruleName} otomasyonu başarıyla ${status}.`, "success");
}

// SMS Paketi Satın Alma Modalı
function openSmsPackageModal() {
	const modal = document.getElementById('sms-package-modal');
	const balanceWarningVal = document.getElementById('sms-modal-wallet-balance');
	
	if (!modal) return;
	
	// Cüzdan bakiyesini dinamik göster
	if (balanceWarningVal) {
		balanceWarningVal.textContent = "₺" + currentBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	}
	
	modal.style.display = 'flex';
}

function closeSmsPackageModal() {
	const modal = document.getElementById('sms-package-modal');
	if (modal) {
		modal.style.display = 'none';
	}
}

// Paket Seçimi
function selectSmsPackage(pkgId, price, amount) {
	const cards = document.querySelectorAll('.sms-package-card');
	cards.forEach(card => card.classList.remove('active'));
	
	const selectedCard = document.getElementById(pkgId);
	if (selectedCard) {
		selectedCard.classList.add('active');
	}
	
	selectedSmsPackageData = { id: pkgId, price: price, amount: amount };
}

// Satın Almayı Onayla (Cüzdan Bakiyesi Kontrollü)
function confirmSmsPurchase() {
	if (currentBalance < selectedSmsPackageData.price) {
		showNotification("Hata: Ana cüzdan bakiyeniz yetersiz. Lütfen cüzdanınıza bakiye yükleyin.", "error");
		closeSmsPackageModal();
		return;
	}
	
	// Simüle ödeme adımları (SaaS hissiyatı için 500ms yapay gecikme)
	const confirmBtn = document.querySelector('.btn-sms-confirm');
	const oldBtnHtml = confirmBtn.innerHTML;
	confirmBtn.disabled = true;
	confirmBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Onaylanıyor...';
	
	setTimeout(() => {
		// Bakiyeyi düş
		currentBalance -= selectedSmsPackageData.price;
		// SMS hakkını artır
		smsBalance += selectedSmsPackageData.amount;
		
		// Arayüzleri güncelle
		updateBalanceDisplay();
		const statVal = document.getElementById('sms-balance-stat');
		if (statVal) {
			statVal.textContent = smsBalance;
		}
		
		// İşlem geçmişine satın almayı kaydet
		const now = new Date();
		const dateStr = now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) + ', ' + now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
		
		const newTrans = {
			id: 't-' + Date.now(),
			date: dateStr,
			desc: `${selectedSmsPackageData.amount} SMS Paketi Satın Alındı`,
			amount: -selectedSmsPackageData.price,
			status: 'completed'
		};
		transactions.unshift(newTrans);
		renderTransactions();
		
		confirmBtn.disabled = false;
		confirmBtn.innerHTML = oldBtnHtml;
		
		closeSmsPackageModal();
		showNotification(`Başarılı: ${selectedSmsPackageData.amount} SMS paketiniz tanımlandı.`, 'success');
	}, 600);
}

// ==========================================================================
// 16. AYARLAR & RAPORLAR (SETTINGS & REPORTS) PANEL MANTIĞI
// ==========================================================================

// Bildirim Toggles Değişimi
function handleSettingsNotificationChange(toggle, settingName) {
	const status = toggle.checked ? "aktif edildi" : "devre dışı bırakıldı";
	showNotification(`${settingName} tercihi ${status}.`, "success");
}



// ==========================================================================
// 17. RAPORLAR (REPORTS) DETAYLI FINANSAL VERİLER & EXCEL LOG MANTIĞI
// ==========================================================================

// Raporlar Sayfası Finansal Log Verisi (6-8 adet gerçekçi örnek sipariş)
let reportTransactions = [
	{ date: '24 Mayıs 2026', code: '#1024', customer: 'Ahmet Yılmaz', carrier: 'Aras Kargo', cost: 85.00, revenue: 450.00, profit: 365.00 },
	{ date: '23 Mayıs 2026', code: '#1023', customer: 'Ayşe Demir', carrier: 'Yurtiçi Kargo', cost: 95.00, revenue: 1200.00, profit: 1105.00 },
	{ date: '23 Mayıs 2026', code: '#1022', customer: 'Can Özkan', carrier: 'MNG Kargo', cost: 80.00, revenue: 850.00, profit: 770.00 },
	{ date: '22 Mayıs 2026', code: '#1021', customer: 'Elif Kaya', carrier: 'Sürat Kargo', cost: 110.00, revenue: 1400.00, profit: 1290.00 },
	{ date: '22 Mayıs 2026', code: '#1020', customer: 'Murat Şahin', carrier: 'Aras Kargo', cost: 85.00, revenue: 3100.00, profit: 3015.00 },
	{ date: '21 Mayıs 2026', code: '#1019', customer: 'Canan Aslan', carrier: 'Yurtiçi Kargo', cost: 95.00, revenue: 4200.00, profit: 4105.00 },
	{ date: '20 Mayıs 2026', code: '#1018', customer: 'Bülent Yılmaz', carrier: 'Aras Kargo', cost: 85.00, revenue: 950.00, profit: 865.00 },
	{ date: '19 Mayıs 2026', code: '#1017', customer: 'Gözde Karaca', carrier: 'MNG Kargo', cost: 80.00, revenue: 1100.00, profit: 1020.00 }
];

// Aktif Rapor Filtresi
let currentReportFilter = 'ciro';

// Rapor Log Tablosunu Dinamik Doldurma (Filtreli Görünüm)
function renderReportTable(filterType) {
	currentReportFilter = filterType;
	
	// Kart aktiflik durumlarını güncelle
	const cards = document.querySelectorAll('.report-finance-card');
	cards.forEach(card => card.classList.remove('active'));
	
	let activeIndex = 0;
	if (filterType === 'gider') activeIndex = 1;
	else if (filterType === 'ortalama') activeIndex = 2;
	else if (filterType === 'kar') activeIndex = 3;
	
	if (cards[activeIndex]) {
		cards[activeIndex].classList.add('active');
	}
	
	const titleEl = document.querySelector('.ledger-title');
	const thead = document.querySelector('.ledger-table thead');
	const tbody = document.getElementById('reports-ledger-tbody');
	
	if (!thead || !tbody) return;
	
	tbody.innerHTML = '';
	
	if (filterType === 'ciro') {
		if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-receipt"></i> Güncel Sipariş ve Gelir Logu (Toplam Ciro Detayları)';
		thead.innerHTML = `
			<tr>
				<th>Tarih</th>
				<th>Sipariş Kodu</th>
				<th>Müşteri</th>
				<th class="align-right">Sipariş Tutarı (Gelir)</th>
			</tr>
		`;
		
		reportTransactions.forEach(t => {
			const tr = document.createElement('tr');
			const revenueFormatted = '₺' + t.revenue.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
			tr.innerHTML = `
				<td>${escapeHTML(t.date)}</td>
				<td class="ledger-code-style">${escapeHTML(t.code)}</td>
				<td>${escapeHTML(t.customer)}</td>
				<td class="align-right ledger-profit-green" style="font-weight: 600;">${revenueFormatted}</td>
			`;
			tbody.appendChild(tr);
		});
	} 
	else if (filterType === 'gider') {
		if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-receipt"></i> Güncel Sipariş ve Lojistik Giderleri Logu';
		thead.innerHTML = `
			<tr>
				<th>Tarih</th>
				<th>Sipariş Kodu</th>
				<th>Müşteri</th>
				<th>Kargo Firması</th>
				<th class="align-right">Kargo Maliyeti (Gider)</th>
			</tr>
		`;
		
		reportTransactions.forEach(t => {
			const tr = document.createElement('tr');
			const costFormatted = '₺' + t.cost.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
			tr.innerHTML = `
				<td>${escapeHTML(t.date)}</td>
				<td class="ledger-code-style">${escapeHTML(t.code)}</td>
				<td>${escapeHTML(t.customer)}</td>
				<td>${escapeHTML(t.carrier)}</td>
				<td class="align-right ledger-cost-red" style="font-weight: 600;">${costFormatted}</td>
			`;
			tbody.appendChild(tr);
		});
	}
	else if (filterType === 'ortalama') {
		if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-receipt"></i> Sipariş Değerleri ve Ortalama Hesaplama Detayları';
		thead.innerHTML = `
			<tr>
				<th>Tarih</th>
				<th>Sipariş Kodu</th>
				<th>Müşteri</th>
				<th class="align-right">Sipariş Tutarı</th>
			</tr>
		`;
		
		let totalRevenue = 0;
		reportTransactions.forEach(t => {
			totalRevenue += t.revenue;
			const tr = document.createElement('tr');
			const revenueFormatted = '₺' + t.revenue.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
			tr.innerHTML = `
				<td>${escapeHTML(t.date)}</td>
				<td class="ledger-code-style">${escapeHTML(t.code)}</td>
				<td>${escapeHTML(t.customer)}</td>
				<td class="align-right">${revenueFormatted}</td>
			`;
			tbody.appendChild(tr);
		});
		
		const avgValue = totalRevenue / reportTransactions.length;
		const avgFormatted = '₺' + avgValue.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
		const summaryTr = document.createElement('tr');
		summaryTr.style.background = 'rgba(40, 167, 73, 0.05)';
		summaryTr.style.fontWeight = 'bold';
		summaryTr.innerHTML = `
			<td colspan="3" style="color: var(--primary); padding: 14px 20px;">Ortalama Sipariş Değeri (${reportTransactions.length} Sipariş):</td>
			<td class="align-right" style="color: var(--primary); padding: 14px 20px;">${avgFormatted}</td>
		`;
		tbody.appendChild(summaryTr);
	}
	else if (filterType === 'kar') {
		if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-receipt"></i> Net Kâr Analiz Logu (Gelir - Gider)';
		thead.innerHTML = `
			<tr>
				<th>Tarih</th>
				<th>Sipariş Kodu</th>
				<th>Müşteri</th>
				<th class="align-right">Gelir (Sipariş Tutarı)</th>
				<th class="align-right">Gider (Kargo Maliyeti)</th>
				<th class="align-right">Net Kâr (Kazanç)</th>
			</tr>
		`;
		
		reportTransactions.forEach(t => {
			const tr = document.createElement('tr');
			const costFormatted = '₺' + t.cost.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
			const revenueFormatted = '₺' + t.revenue.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
			const profitFormatted = '₺' + t.profit.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
			tr.innerHTML = `
				<td>${escapeHTML(t.date)}</td>
				<td class="ledger-code-style">${escapeHTML(t.code)}</td>
				<td>${escapeHTML(t.customer)}</td>
				<td class="align-right">${revenueFormatted}</td>
				<td class="align-right ledger-cost-red">${costFormatted}</td>
				<td class="align-right ledger-profit-green" style="font-weight: 600;">${profitFormatted}</td>
			`;
			tbody.appendChild(tr);
		});
	}
}

// Excel Benzeri Log Tablosunu Doldurma
function renderReportTransactions() {
	renderReportTable(currentReportFilter);
}

// Excel Olarak İndir Simülasyonu
function downloadReportsExcel() {
	let reportName = 'nestro-toplam-ciro-raporu.xlsx';
	if (currentReportFilter === 'gider') reportName = 'nestro-lojistik-giderleri-raporu.xlsx';
	else if (currentReportFilter === 'ortalama') reportName = 'nestro-ortalama-siparis-degeri-raporu.xlsx';
	else if (currentReportFilter === 'kar') reportName = 'nestro-net-kar-raporu.xlsx';
	
	showNotification(`Excel raporu başarıyla oluşturuldu ve indirildi. (${reportName})`, 'success');
}

// ==========================================================================
// 18. KARGO FİRMASI SEÇİMİ (SHIPPING CARRIER SELECTION) AYARLARI
// ==========================================================================

// Kargo Ayarlarını Başlat ve Yerel Depolamada Sakla
function initCarrierSettings() {
	// Yerel depolamada varsayılan kargo değerlerini set et (eğer yoksa)
	if (!localStorage.getItem('nestro_carrier_paid')) {
		localStorage.setItem('nestro_carrier_paid', 'Yurtiçi Kargo');
	}
	if (!localStorage.getItem('nestro_carrier_cod')) {
		localStorage.setItem('nestro_carrier_cod', 'Aras Kargo');
	}

	const paidSelect = document.getElementById('carrier-paid-select');
	const codSelect = document.getElementById('carrier-cod-select');

	if (paidSelect) {
		paidSelect.value = localStorage.getItem('nestro_carrier_paid') || 'Yurtiçi Kargo';
	}

	if (codSelect) {
		codSelect.value = localStorage.getItem('nestro_carrier_cod') || 'Aras Kargo';
	}
}

// Kargo Ayarlarını Kaydet (Manuel Kaydet Butonu)
function handleSaveCarrierSettings() {
	const btn = document.getElementById('btn-save-carrier');
	const paidSelect = document.getElementById('carrier-paid-select');
	const codSelect = document.getElementById('carrier-cod-select');

	if (!btn) return;

	const paidVal = paidSelect ? paidSelect.value : 'Yurtiçi Kargo';
	const codVal = codSelect ? codSelect.value : 'Aras Kargo';

	// Değerleri localStorage'a kaydet
	localStorage.setItem('nestro_carrier_paid', paidVal);
	localStorage.setItem('nestro_carrier_cod', codVal);

	// Pulse ve Yükleniyor Efekti
	btn.classList.add('loading-pulse');
	const oldHtml = btn.innerHTML;
	btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> <span>Kaydediliyor...</span>';

	setTimeout(() => {
		btn.classList.remove('loading-pulse');
		btn.innerHTML = oldHtml;
		
		// Başarı Toast Bildirimi (Yeşil kart, checkmark ikonu)
		showNotification('Başarıyla kaydedildi', 'success');
	}, 800);
}

// ==========================================================================
// 19. DEPOYA ÜRÜN GÖNDER / GÖNDERİ OLUŞTURMA İŞLEMLERİ (SEND TO WAREHOUSE)
// ==========================================================================

const NESTRO_WAREHOUSE_ADDRESS = {
	name: "Nestro Depo (Fulfillment)",
	phone: "0216 555 45 45",
	city: "İstanbul",
	district: "Tuzla",
	address: "Orta Mahalle, Üniversite Caddesi No:15, Nestro Lojistik Merkezi, Tuzla / İstanbul"
};

let currentServiceType = 'return';

// Depoya Ürün Gönder Helper Fonksiyonları

// Hizmet Türü Değişimi ve Adres Otomatik Doldurma / Kitleme / Yaylanarak Fırlama (Spring) Animasyonu
function setServiceType(type) {
	currentServiceType = type;
	
	const btnReturn = document.getElementById('btn-service-return');
	const btnStandard = document.getElementById('btn-service-standard');
	
	const senderCard = document.getElementById('sender-info-card');
	const receiverCard = document.getElementById('receiver-info-card');
	const paymentCard = document.getElementById('shipment-payment-card');
	
	// Form input elements
	const senderName = document.getElementById('sender-name');
	const senderPhone = document.getElementById('sender-phone');
	const senderCity = document.getElementById('sender-city');
	const senderDistrict = document.getElementById('sender-district');
	const senderAddress = document.getElementById('sender-address');
	
	const receiverName = document.getElementById('receiver-name');
	const receiverPhone = document.getElementById('receiver-phone');
	const receiverCity = document.getElementById('receiver-city');
	const receiverDistrict = document.getElementById('receiver-district');
	const receiverAddress = document.getElementById('receiver-address');
	
	const desi = document.getElementById('shipment-desi');
	const packages = document.getElementById('shipment-packages');
	const paymentMethod = document.getElementById('shipment-payment-method');

	if (btnReturn) {
		if (type === 'return') btnReturn.classList.add('active');
		else btnReturn.classList.remove('active');
	}
	if (btnStandard) {
		if (type === 'standard') btnStandard.classList.add('active');
		else btnStandard.classList.remove('active');
	}

	const animatedCards = [senderCard, receiverCard, paymentCard];
	const formFields = [
		senderName, senderPhone, senderCity, senderDistrict, senderAddress,
		receiverName, receiverPhone, receiverCity, receiverDistrict, receiverAddress,
		desi, packages
	];

	if (type === 'return') {
		// Kartları gizle/göster (Sol ve sağ kolondaki adres kartları gizlenir, ödeme kartı gösterilir)
		if (senderCard) senderCard.classList.remove('show');
		if (receiverCard) receiverCard.classList.remove('show');
		if (paymentCard) paymentCard.classList.add('show');

		// Gizlenen form elemanlarının required durumunu kaldır ve temizle
		const hiddenFields = [
			senderName, senderPhone, senderCity, senderDistrict, senderAddress,
			receiverName, receiverPhone, receiverCity, receiverDistrict, receiverAddress
		];
		hiddenFields.forEach(field => {
			if (field) {
				field.removeAttribute('required');
				field.value = ''; // temizle
			}
		});

		// Ödeme kartı görünür olduğu için desi ve paket alanlarını doldur ve required yap
		if (desi) {
			desi.setAttribute('required', 'true');
			if (!desi.value) desi.value = '2';
		}
		if (packages) {
			packages.setAttribute('required', 'true');
			if (!packages.value) packages.value = '1';
		}
	} else if (type === 'standard') {
		// Tüm kartları göster
		if (senderCard) senderCard.classList.add('show');
		if (receiverCard) receiverCard.classList.add('show');
		if (paymentCard) paymentCard.classList.add('show');

		// Tüm girdileri required yap
		formFields.forEach(field => {
			if (field) {
				field.setAttribute('required', 'true');
			}
		});
	}
}

// Gönderi Oluşturma Form Gönderimi
function handleCreateWarehouseShipment(event) {
	event.preventDefault();
	
	const carrier = document.getElementById('shipment-carrier').value;
	const refId = document.getElementById('shipment-ref-id').value || '-';
	const serviceType = currentServiceType;
	
	let senderNameVal, senderPhoneVal, senderCityVal, senderDistrictVal, senderAddressVal;
	let receiverNameVal, receiverPhoneVal, receiverCityVal, receiverDistrictVal, receiverAddressVal;
	let desiVal, packagesVal, noteVal, paymentMethodVal;
	
	if (serviceType === 'return') {
		// İade (Depoya Gönderim) Modu: Alıcı Nestro Deposudur (Formda doldurulmasına gerek yok)
		senderNameVal = 'emin çeri (Mağaza Sahibi)';
		senderPhoneVal = '0555 123 45 67';
		senderCityVal = 'İstanbul';
		senderDistrictVal = 'Kadıköy';
		senderAddressVal = 'Caferağa Mah. Moda Cad. No:82';
		
		receiverNameVal = NESTRO_WAREHOUSE_ADDRESS.name;
		receiverPhoneVal = NESTRO_WAREHOUSE_ADDRESS.phone;
		receiverCityVal = NESTRO_WAREHOUSE_ADDRESS.city;
		receiverDistrictVal = NESTRO_WAREHOUSE_ADDRESS.district;
		receiverAddressVal = NESTRO_WAREHOUSE_ADDRESS.address;
		
		desiVal = document.getElementById('shipment-desi').value || '2';
		packagesVal = document.getElementById('shipment-packages').value || '1';
		noteVal = document.getElementById('shipment-note').value || '-';
		paymentMethodVal = document.getElementById('shipment-payment-method').value || 'cari';
	} else {
		// Standart Teslimat Modu: Formdan bilgileri al
		senderNameVal = document.getElementById('sender-name').value;
		senderPhoneVal = document.getElementById('sender-phone').value;
		senderCityVal = document.getElementById('sender-city').value;
		senderDistrictVal = document.getElementById('sender-district').value;
		senderAddressVal = document.getElementById('sender-address').value;
		
		receiverNameVal = document.getElementById('receiver-name').value;
		receiverPhoneVal = document.getElementById('receiver-phone').value;
		receiverCityVal = document.getElementById('receiver-city').value;
		receiverDistrictVal = document.getElementById('receiver-district').value;
		receiverAddressVal = document.getElementById('receiver-address').value;
		
		desiVal = document.getElementById('shipment-desi').value;
		packagesVal = document.getElementById('shipment-packages').value;
		noteVal = document.getElementById('shipment-note').value || '-';
		paymentMethodVal = document.getElementById('shipment-payment-method').value;
		
		if (!senderNameVal || !senderPhoneVal || !senderCityVal || !senderDistrictVal || !senderAddressVal || 
			!receiverNameVal || !receiverPhoneVal || !receiverCityVal || !receiverDistrictVal || !receiverAddressVal || !desiVal || !packagesVal) {
			showNotification('Lütfen zorunlu alanları doldurun.', 'error');
			return;
		}
	}
	
	if (!carrier) {
		showNotification('Lütfen bir taşıyıcı firma seçiniz.', 'error');
		return;
	}

	const btnSubmit = document.getElementById('btn-create-warehouse-shipment');
	if (!btnSubmit) return;

	// Spinner & Pulse Efekti
	btnSubmit.classList.add('loading-pulse');
	const oldBtnHtml = btnSubmit.innerHTML;
	btnSubmit.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> <span>Gönderi Oluşturuluyor...</span>';

	setTimeout(() => {
		btnSubmit.classList.remove('loading-pulse');
		btnSubmit.innerHTML = oldBtnHtml;

		// Depo modalı artık düz sayfa olduğu için kapatma işlemi yapılmaz

		// Takip Numarası Oluşturma (Mock)
		const randomTracking = 'NT' + Math.floor(100000000 + Math.random() * 900000000);
		const today = new Date().toLocaleDateString('tr-TR');

		// Başarı Label Kart Değerleri
		document.getElementById('label-carrier').textContent = carrier;
		document.getElementById('label-service-type').textContent = serviceType === 'return' ? 'İADE' : 'STANDART';
		
		document.getElementById('label-sender-name').textContent = senderNameVal;
		document.getElementById('label-sender-phone').textContent = senderPhoneVal;
		document.getElementById('label-sender-address').textContent = `${senderAddressVal} ${senderDistrictVal}/${senderCityVal}`;
		
		document.getElementById('label-receiver-name').textContent = receiverNameVal;
		document.getElementById('label-receiver-phone').textContent = receiverPhoneVal;
		document.getElementById('label-receiver-address').textContent = `${receiverAddressVal} ${receiverDistrictVal}/${receiverCityVal}`;
		
		document.getElementById('label-date').textContent = today;
		document.getElementById('label-desi-qty').textContent = `${desiVal} Desi / ${packagesVal} Pk`;
		document.getElementById('label-ref-id').textContent = refId;
		document.getElementById('label-tracking-code').textContent = randomTracking;
		document.getElementById('label-shipment-note').textContent = noteVal;

		// Not satırını göster/gizle
		const labelNoteContainer = document.getElementById('label-note-container');
		if (noteVal === '-') {
			if (labelNoteContainer) labelNoteContainer.style.display = 'none';
		} else {
			if (labelNoteContainer) labelNoteContainer.style.display = 'block';
		}

		// Rapor / Barkod Modalını Aç
		const successModal = document.getElementById('shipment-success-modal');
		if (successModal) successModal.style.display = 'flex';

		showNotification('Gönderi başarıyla oluşturuldu ve etiket hazırlandı.', 'success');
		
		// Form Sıfırlama
		resetWarehouseShipmentForm();
	}, 1500);
}

// Barkod Modalı Kapatma
function closeShipmentSuccessModal() {
	const modal = document.getElementById('shipment-success-modal');
	if (modal) modal.style.display = 'none';
}

// Form Sıfırlama ve Varsayılan Yapma
function resetWarehouseShipmentForm() {
	const form = document.getElementById('warehouse-shipment-form');
	if (form) {
		form.reset();
		setServiceType('return');
	}
}

// Kargo Barkod Etiketini Yazdır
function printBarcodeLabel() {
	const printContent = document.getElementById('printable-barcode-card').innerHTML;
	
	const printWindow = window.open('', '_blank', 'width=600,height=600');
	printWindow.document.write('<html><head><title>Kargo Barkodu Yazdır</title>');
	printWindow.document.write('<style>');
	printWindow.document.write(`
		body { font-family: monospace; padding: 20px; color: #000000; background: #ffffff; }
		.barcode-card { border: 2px solid #000000; padding: 20px; max-width: 450px; margin: 0 auto; }
		.mock-barcode-lines { display: flex; height: 50px; width: 100%; max-width: 320px; background: #000000; margin: 0 auto; }
	`);
	printWindow.document.write('</style></head><body>');
	printWindow.document.write('<div class="barcode-card">');
	printWindow.document.write(printContent);
	printWindow.document.write('</div>');
	printWindow.document.write('<script>window.onload = function() { window.print(); window.close(); }</script>');
	printWindow.document.close();
}

let currentDashboardFilter = null;

// Dashboard Stat Kartları Sipariş Filtreleme
function filterDashboardOrders(statusType, shouldScroll = true) {
	currentDashboardFilter = statusType;
	
	const section = document.getElementById('dashboard-orders-section');
	const title = document.getElementById('dashboard-orders-title');
	const tbody = document.getElementById('dashboard-orders-tbody');
	
	if (!section || !title || !tbody) return;
	
	let titleText = "Siparişler";
	if (statusType === 'preparing') titleText = "Bekleyen Siparişler";
	else if (statusType === 'ready') titleText = "Hazırlanan Siparişler";
	else if (statusType === 'shipped') titleText = "Kargoya Verilen Siparişler";
	else if (statusType === 'problem') titleText = "Sorunlu Siparişler";
	
	title.innerHTML = `<i class="fa-solid fa-boxes-stacked"></i> ${titleText}`;
	
	// Filtreleme (Sorunlu mock olarak boş)
	const filtered = orders.filter(o => o.status === statusType);
	
	tbody.innerHTML = '';
	
	if (filtered.length === 0) {
		const tr = document.createElement('tr');
		tr.innerHTML = `<td colspan="7" style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 13.5px;">Bu durumda herhangi bir sipariş bulunmamaktadır.</td>`;
		tbody.appendChild(tr);
	} else {
		filtered.forEach(order => {
			const tr = document.createElement('tr');
			
			// Ödeme Yöntemi
			let paymentBadge = '';
			if (order.payment === 'card') {
				paymentBadge = `<span class="badge-payment card"><i class="fa-solid fa-credit-card"></i> Kredi Kartı</span>`;
			} else {
				paymentBadge = `<span class="badge-payment cod"><i class="fa-solid fa-hand-holding-dollar"></i> Kapıda Ödeme</span>`;
			}
			
			// Durum Rozeti
			let statusBadge = '';
			if (order.status === 'preparing') {
				statusBadge = `<span class="status-pill preparing"><i class="fa-solid fa-clock"></i> Hazırlanıyor</span>`;
			} else if (order.status === 'ready') {
				statusBadge = `<span class="status-pill ready"><i class="fa-solid fa-spinner fa-spin-slow"></i> Hazırlandı</span>`;
			} else if (order.status === 'shipped') {
				statusBadge = `<span class="status-pill shipped"><i class="fa-solid fa-truck-fast"></i> Kargoya Verildi</span>`;
			} else if (order.status === 'cancelled') {
				statusBadge = `<span class="status-pill cancelled"><i class="fa-solid fa-ban"></i> İptal Edildi</span>`;
			}
			
			// İptal Butonu
			const showCancel = order.status !== 'shipped' && order.status !== 'cancelled';
			const cancelBtnHTML = showCancel 
				? `<button class="btn-action-cancel" onclick="openCancelModal('${order.code}')"><i class="fa-solid fa-ban"></i> İptal</button>` 
				: '';
				
			const totalFormatted = '₺' + order.total.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
			const cityText = order.city ? ` (${escapeHTML(order.city)})` : '';
			
			tr.innerHTML = `
				<td class="ledger-code-style">${escapeHTML(order.code)}</td>
				<td>${escapeHTML(order.date.split(',')[0])}</td>
				<td><strong>${escapeHTML(order.customer)}</strong><span style="font-size: 12px; color: var(--text-muted);">${cityText}</span></td>
				<td>${paymentBadge}</td>
				<td>${statusBadge}</td>
				<td class="align-right" style="font-weight: 700; color: var(--text-primary);">${totalFormatted}</td>
				<td style="text-align: right; padding-right: 20px;">
					<div style="display: flex; justify-content: flex-end; align-items: center; gap: 6px;">
						<button class="btn-action-detail" onclick="openDetailModal('${order.code}')"><i class="fa-solid fa-circle-info"></i> Detay</button>
						${cancelBtnHTML}
					</div>
				</td>
			`;
			tbody.appendChild(tr);
		});
	}
	
	section.style.display = 'block';
	if (shouldScroll) {
		section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
	}
}

// Dashboard Filtreli Sipariş Tablosunu Kapat
function closeDashboardOrdersSection() {
	currentDashboardFilter = null;
	const section = document.getElementById('dashboard-orders-section');
	if (section) section.style.display = 'none';
}

// ==========================================================================
// 21. MAĞAZAM AÇILIR MENÜSÜ FONKSİYONLARI (STORE DROPDOWN LOGIC)
// ==========================================================================

function toggleStoreDropdown(event) {
	event.stopPropagation();
	const menu = document.getElementById('store-dropdown-menu');
	if (!menu) return;
	
	// E-ticaret kurulum durumunu localStorage'dan oku
	const isSetupCompleted = localStorage.getItem('nestro_setup_completed') === 'true';
	const statusBadge = document.getElementById('dropdown-store-status');
	
	if (statusBadge) {
		if (isSetupCompleted) {
			statusBadge.innerHTML = `<span class="dot"></span> Aktif`;
			statusBadge.style.background = 'var(--primary-light)';
			statusBadge.style.color = 'var(--primary)';
		} else {
			statusBadge.innerHTML = `<span class="dot" style="background-color: var(--text-muted); box-shadow: none;"></span> Çevrimdışı`;
			statusBadge.style.background = '#f1f3f5';
			statusBadge.style.color = 'var(--text-muted)';
		}
	}
	
	menu.classList.toggle('active');
}

function closeStoreDropdown() {
	const menu = document.getElementById('store-dropdown-menu');
	if (menu) menu.classList.remove('active');
}

function navigateToConnectView(event) {
	event.stopPropagation();
	closeStoreDropdown();
	switchView('connect');
}

// Manuel Eşitleme Yapma (Simülasyon)
function triggerManualSync(event) {
	event.stopPropagation();
	const btn = event.currentTarget;
	if (btn.classList.contains('syncing')) return;
	
	btn.classList.add('syncing');
	const textSpan = btn.querySelector('span');
	const oldText = textSpan.textContent;
	textSpan.textContent = 'Eşitleniyor...';
	
	setTimeout(() => {
		btn.classList.remove('syncing');
		textSpan.textContent = oldText;
		
		showNotification('Mağaza siparişleri başarıyla eşitlendi!', 'success');
		
		// Sipariş listesini ve istatistikleri yenile
		renderOrders(currentFilter, currentSearchQuery);
		updateDashboardStats();
	}, 1800);
}

// Açılır menü dışına tıklandığında menüyü kapat
document.addEventListener('click', function(event) {
	const trigger = document.getElementById('store-dropdown-trigger');
	const menu = document.getElementById('store-dropdown-menu');
	if (trigger && menu && !trigger.contains(event.target)) {
		menu.classList.remove('active');
	}
	
	// Bildirim balonu kapatma mantığı
	const notiBtn = document.getElementById('btn-notification-trigger');
	const notiDropdown = document.getElementById('notification-dropdown');
	if (notiBtn && notiDropdown && !notiBtn.contains(event.target) && !notiDropdown.contains(event.target)) {
		notiDropdown.style.display = 'none';
	}
});

// ==========================================================================
// KAPIDA ÖDEME MÜŞTERİ TEYİT VE ARAMA MODÜLÜ MANTIĞI
// ==========================================================================

let activeVerificationOrder = null;
let isAddressEditing = false;
let callDurationSec = 0;
let callTimerInterval = null;
let activeCallState = 'idle'; // 'idle', 'connecting', 'active', 'ended'

// Görünüm Yüklendiğinde Sıfırlama Yap
function initVerificationView() {
	activeVerificationOrder = null;
	isAddressEditing = false;
	callDurationSec = 0;
	activeCallState = 'idle';
	if (callTimerInterval) clearInterval(callTimerInterval);
	
	// Arayüz Elementlerini Temizle
	document.getElementById('verification-search-input').value = '';
	document.getElementById('verification-wallet-balance').textContent = '₺' + currentBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	document.getElementById('verification-order-card').style.display = 'none';
	closeModalWithAnimation('verification-call-panel');
	
	const toast = document.getElementById('verification-toast');
	if (toast) {
		toast.style.display = 'none';
		toast.className = 'verification-alert';
	}
}

// Özel Toast Bildirimi Göster
function showVerificationToast(message, type = 'error') {
	showNotification(message, type);
}

// Shopify Sipariş Numarasını Sorgula
async function handleVerificationSearch(event) {
	event.preventDefault();
	
	const searchInput = document.getElementById('verification-search-input');
	const orderNumber = searchInput.value.trim();
	const btn = document.getElementById('btn-verification-search');
	
	if (!orderNumber) return;
	
	btn.disabled = true;
	btn.textContent = 'Sorgulanıyor...';
	
	// Arayüzü temizle
	document.getElementById('verification-order-card').style.display = 'none';
	closeModalWithAnimation('verification-call-panel');
	isAddressEditing = false;
	
	const SEARCH_COST = 0.50;
	
	// Öncelikli Bakiye Kontrolü
	if (currentBalance < SEARCH_COST) {
		showVerificationToast(`Yetersiz Bakiye! Sorgulama ücreti ₺${SEARCH_COST.toFixed(2)}'dir. Mevcut bakiyeniz: ₺${currentBalance.toFixed(2)}`, 'error');
		btn.disabled = false;
		btn.textContent = `Sorgula (₺${SEARCH_COST.toFixed(2)})`;
		return;
	}

	try {
		// API isteği at
		const response = await fetch('/api/shopifyOrder', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				orderNumber: orderNumber,
				userId: 'user_1'
			})
		});
		
		const data = await response.json();
		
		if (!response.ok) {
			throw new Error(data.error || 'API isteği başarısız oldu.');
		}
		
		// Başarılı ise verileri yerleştir
		activeVerificationOrder = data.order;
		currentBalance = data.balance;
		
		// Bakiye göstergelerini güncelle
		updateBalanceDisplay();
		document.getElementById('verification-wallet-balance').textContent = '₺' + currentBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
		
		renderVerificationOrderDetails();
		showVerificationToast('Sipariş verileri Shopify üzerinden başarıyla getirildi (₺0.50 düşüldü).', 'success');
		
	} catch (err) {
		console.warn('API Bağlantısı sağlanamadı veya Shopify yapılandırması eksik. Lokal veri fallback devrede.', err);
		
		// Fallback: Lokal "orders" dizininde ara (Müşterinin test edebilmesi için demo modu)
		const formattedQuery = orderNumber.startsWith('#') ? orderNumber : `#${orderNumber}`;
		const cleanQuery = orderNumber.replace('#', '');
		
		const localOrder = orders.find(o => o.code === formattedQuery || o.code.replace('#', '') === cleanQuery);
		
		if (localOrder) {
			// Bakiyeyi düş
			currentBalance -= SEARCH_COST;
			updateBalanceDisplay();
			document.getElementById('verification-wallet-balance').textContent = '₺' + currentBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
			
			// Map localOrder to matching structure
			activeVerificationOrder = {
				id: Math.floor(Math.random() * 100000) + 1000,
				order_number: localOrder.code,
				financial_status: localOrder.status === 'ready' ? 'paid' : 'pending',
				total_price: localOrder.total.toString(),
				currency: 'TRY',
				customer: {
					first_name: localOrder.customer.split(' ')[0] || '',
					last_name: localOrder.customer.split(' ').slice(1).join(' ') || '',
					phone: localOrder.phone || '+90 555 123 4567'
				},
				shipping_address: {
					address1: localOrder.address.split(',')[1]?.trim() || localOrder.address,
					address2: localOrder.address.split(',')[2]?.trim() || '',
					city: localOrder.address.split(',')[localOrder.address.split(',').length - 1]?.trim() || localOrder.city,
					province: localOrder.city,
					zip: '34000',
					country: 'Turkey'
				},
				line_items: localOrder.products.map((p, idx) => ({
					id: idx + 1,
					title: p.name,
					quantity: p.qty,
					price: p.price.replace('₺', '').replace(',', '').trim()
				}))
			};
			
			renderVerificationOrderDetails();
			showVerificationToast(`[DEMO MODU] Shopify bağlantısı olmadığı için lokal veri getirildi (₺0.50 Kredi Düşüldü).`, 'success');
		} else {
			showVerificationToast(`Girilen numaraya ait sipariş bulunamadı (${orderNumber}).`, 'error');
		}
	} finally {
		btn.disabled = false;
		btn.textContent = `Sorgula (₺${SEARCH_COST.toFixed(2)})`;
	}
}

// Sipariş Detaylarını Ekrana Yazdır
function renderVerificationOrderDetails() {
	if (!activeVerificationOrder) return;
	
	// Kartı göster
	document.getElementById('verification-order-card').style.display = 'grid';
	
	// Müşteri bilgileri
	document.getElementById('v-customer-name').textContent = `${activeVerificationOrder.customer.first_name} ${activeVerificationOrder.customer.last_name}`;
	document.getElementById('v-customer-phone').textContent = activeVerificationOrder.customer.phone || 'Girilmemiş';
	
	// Adres bilgileri
	document.getElementById('v-address-line1').textContent = activeVerificationOrder.shipping_address.address1 || '-';
	document.getElementById('v-address-line2').textContent = activeVerificationOrder.shipping_address.address2 || '';
	document.getElementById('v-address-city-province-zip').textContent = `${activeVerificationOrder.shipping_address.zip || ''} - ${activeVerificationOrder.shipping_address.city || ''} / ${activeVerificationOrder.shipping_address.province || ''}`;
	
	// Shopify Finansal Durumu
	const statusBadge = document.getElementById('v-financial-status');
	statusBadge.textContent = activeVerificationOrder.financial_status;
	statusBadge.className = `status-badge status-badge-${activeVerificationOrder.financial_status === 'paid' ? 'paid' : 'pending'}`;
	
	// Ürünleri Listele
	const itemsBody = document.getElementById('v-order-items-body');
	itemsBody.innerHTML = '';
	
	activeVerificationOrder.line_items.forEach(item => {
		const row = document.createElement('tr');
		
		const totalPrice = (parseFloat(item.price) * item.quantity).toFixed(2);
		
		row.innerHTML = `
			<td>
				<strong>${item.title}</strong>
				${item.variant_title ? `<br><small style="color: var(--text-muted); font-size: 11px;">${item.variant_title}</small>` : ''}
			</td>
			<td>${item.quantity}</td>
			<td>₺${parseFloat(item.price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
			<td>₺${parseFloat(totalPrice).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
		`;
		itemsBody.appendChild(row);
	});
	
	// Toplam Fiyat
	const totalPrice = parseFloat(activeVerificationOrder.total_price);
	document.getElementById('v-order-total-price').textContent = '₺' + totalPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 });
}

// Adres Düzenleme Görünümünü Aç/Kapat
function toggleAddressEdit() {
	const displayDiv = document.getElementById('v-address-display');
	const editFormDiv = document.getElementById('v-address-edit-form');
	const btn = document.getElementById('btn-toggle-address-edit');
	
	isAddressEditing = !isAddressEditing;
	
	if (isAddressEditing) {
		btn.textContent = 'İptal Et';
		displayDiv.style.display = 'none';
		editFormDiv.style.display = 'flex';
		
		// Formu doldur
		document.getElementById('v-edit-address1').value = activeVerificationOrder.shipping_address.address1 || '';
		document.getElementById('v-edit-address2').value = activeVerificationOrder.shipping_address.address2 || '';
		document.getElementById('v-edit-city').value = activeVerificationOrder.shipping_address.city || '';
		document.getElementById('v-edit-province').value = activeVerificationOrder.shipping_address.province || '';
		document.getElementById('v-edit-zip').value = activeVerificationOrder.shipping_address.zip || '';
	} else {
		btn.textContent = 'Düzenle';
		displayDiv.style.display = 'block';
		editFormDiv.style.display = 'none';
	}
}

// Aramayı Başlat (Call Action)
async function startCustomerCall() {
	const CALL_COST = 1.00;
	
	const agentPhoneInput = document.getElementById('v-agent-phone-input');
	const agentPhone = agentPhoneInput ? agentPhoneInput.value.trim() : '';
	
	if (!agentPhone) {
		alert('Aramayı başlatabilmek için önce kendi dahili / cep telefon numaranızı girmelisiniz.');
		return;
	}

	if (currentBalance < CALL_COST) {
		showVerificationToast(`Yetersiz Bakiye! Arama başlatma bedeli ₺${CALL_COST.toFixed(2)}'dir. Mevcut bakiyeniz: ₺${currentBalance.toFixed(2)}`, 'error');
		return;
	}
	
	// Arama panelini aç ve bağlanıyor moduna geçir
	const callPanel = document.getElementById('verification-call-panel');
	if (callPanel) callPanel.style.display = 'flex';
	
	// Arama esnasında form alanlarını gizle, sadece kapatma butonunu göster
	const callActiveSec = document.getElementById('v-call-active-section');
	const callOutcomeSec = document.getElementById('v-call-outcome-section');
	const callFooterSec = document.getElementById('v-call-footer-section');
	if (callActiveSec) callActiveSec.style.display = 'block';
	if (callOutcomeSec) callOutcomeSec.style.display = 'none';
	if (callFooterSec) callFooterSec.style.display = 'none';
	
	// Form elemanlarını sıfırla
	const notesTextarea = document.getElementById('v-call-notes');
	if (notesTextarea) notesTextarea.value = '';
	const outcomeSelect = document.getElementById('v-call-outcome');
	if (outcomeSelect) outcomeSelect.selectedIndex = 0;

	const statusDot = document.getElementById('v-call-pulse');
	const statusText = document.getElementById('v-call-status-text');
	const timerVal = document.getElementById('v-call-timer');
	
	activeCallState = 'connecting';
	if (statusDot) statusDot.style.background = '#f59e0b';
	if (statusText) statusText.textContent = 'Bağlanıyor...';
	if (timerVal) timerVal.textContent = '00:00';
	
	callDurationSec = 0;
	if (callTimerInterval) clearInterval(callTimerInterval);
	
	// API'den Netgsm Click to Call başlatma
	try {
		const response = await fetch('/api/netgsmCall', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				userId: 'user_1',
				customerPhone: activeVerificationOrder.customer.phone,
				agentPhone: agentPhone
			})
		});
		
		const data = await response.json();
		
		if (!response.ok) {
			throw new Error(data.error || 'Netgsm arama API hatası.');
		}
		
		// Başarılı ise arama ID'sini sakla ve bakiyeyi güncelle
		activeVerificationOrder.netgsmJobId = data.jobId;
		currentBalance = data.balance;
		
		updateBalanceDisplay();
		document.getElementById('verification-wallet-balance').textContent = '₺' + currentBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
		
		showVerificationToast('Netgsm arama tetiklendi! Önce kendi telefonunuza gelen aramayı yanıtlayın.', 'success');
		
		// 3.5 Saniye sonra görüşmenin bağlandığını simüle et/varsay (Click to Call akışı)
		setTimeout(() => {
			if (activeCallState === 'connecting') {
				activeCallState = 'active';
				statusDot.style.background = '#ef4444';
				statusText.textContent = 'Görüşme Aktif';
				
				// Sayacı başlat
				callTimerInterval = setInterval(() => {
					callDurationSec++;
					const mins = Math.floor(callDurationSec / 60);
					const secs = callDurationSec % 60;
					timerVal.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
				}, 1000);
			}
		}, 3500);

	} catch (e) {
		console.warn('Netgsm API araması başarısız. Arama arayüzü lokal demo modunda çalıştırılacak.', e);
		
		// Fallback: Lokal bakiye düşüp simülasyonu başlat
		currentBalance -= CALL_COST;
		updateBalanceDisplay();
		document.getElementById('verification-wallet-balance').textContent = '₺' + currentBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
		
		activeVerificationOrder.netgsmJobId = 'demo_job_id_' + Math.floor(Math.random() * 100000);
		showVerificationToast('[DEMO MODU] Netgsm araması başlatıldı. Önce kendi telefonunuz çalıyor (₺1.00 düşüldü).', 'success');
		
		setTimeout(() => {
			if (activeCallState === 'connecting') {
				activeCallState = 'active';
				statusDot.style.background = '#ef4444';
				statusText.textContent = 'Görüşme Aktif';
				
				callTimerInterval = setInterval(() => {
					callDurationSec++;
					const mins = Math.floor(callDurationSec / 60);
					const secs = callDurationSec % 60;
					timerVal.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
				}, 1000);
			}
		}, 3000);
	}
}

// Aramayı Kapat
function endCustomerCall() {
	if (activeCallState === 'idle') return;
	
	activeCallState = 'ended';
	if (callTimerInterval) clearInterval(callTimerInterval);
	
	const statusDot = document.getElementById('v-call-pulse');
	const statusText = document.getElementById('v-call-status-text');
	
	if (statusDot) statusDot.style.background = '#64748b';
	if (statusText) statusText.textContent = 'Arama Kapatıldı';
	
	// Arama bittiğinde kapatma butonunu gizle, form alanlarını ve footer'ı göster
	const callActiveSec = document.getElementById('v-call-active-section');
	const callOutcomeSec = document.getElementById('v-call-outcome-section');
	const callFooterSec = document.getElementById('v-call-footer-section');
	if (callActiveSec) callActiveSec.style.display = 'none';
	if (callOutcomeSec) callOutcomeSec.style.display = 'flex';
	if (callFooterSec) callFooterSec.style.display = 'flex';
	
	showVerificationToast('Arama kapatıldı. Lütfen görüşme sonucunu ve notlarınızı girerek kaydedin.', 'success');
}

// Arama Modalını Kapat (Kullanıcı çarpıya bastığında tetiklenir)
function closeCallModal() {
	if (activeCallState === 'connecting' || activeCallState === 'active') {
		// Arama aktifse çarpıya basıldığında sadece aramayı kapatıp sonuç formunu gösteriyoruz
		endCustomerCall();
	} else {
		// Arama zaten bittiyse modalı tamamen kapatıyoruz
		closeModalWithAnimation('verification-call-panel');
	}
}

// Çağrı Sonucunu Kaydet ve Siparişi Doğrula
async function saveCallOutcome() {
	const outcomeSelect = document.getElementById('v-call-outcome');
	const notesTextarea = document.getElementById('v-call-notes');
	
	const outcome = outcomeSelect.value;
	const notes = notesTextarea.value.trim();
	
	let newAddress = null;
	
	// Eğer adres güncellenmişse yeni adresi paketle
	if (isAddressEditing && outcome === 'ADRES_GUNCELLEDNDI') {
		newAddress = {
			address1: document.getElementById('v-edit-address1').value.trim(),
			address2: document.getElementById('v-edit-address2').value.trim(),
			city: document.getElementById('v-edit-city').value.trim(),
			province: document.getElementById('v-edit-province').value.trim(),
			zip: document.getElementById('v-edit-zip').value.trim()
		};
		
		if (!newAddress.address1 || !newAddress.city || !newAddress.province || !newAddress.zip) {
			alert('Lütfen zorunlu adres alanlarını (*) doldurunuz.');
			return;
		}
	}
	
	try {
		// LogOutcome API'sine gönder
		const response = await fetch('/api/logCallOutcome', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				userId: 'user_1',
				orderId: activeVerificationOrder.id,
				orderNumber: activeVerificationOrder.order_number,
				status: outcome,
				notes: notes,
				duration: callDurationSec,
				newAddress: newAddress,
				jobId: activeVerificationOrder.netgsmJobId || ''
			})
		});
		
		const data = await response.json();
		
		if (!response.ok) {
			throw new Error(data.error || 'Arama kaydı sunucuya işlenemedi.');
		}
		
		currentBalance = data.balance;
		updateBalanceDisplay();
		
		showNotification(`Sipariş Teyit Sonucu Kaydedildi: ${outcome}`, 'success');
		
	} catch (err) {
		console.warn('API bağlantısı kurulamadığı için teyit verileri lokal simüle edildi.', err);
		
		// Fallback: Lokal siparişi güncelle (Lokal simülasyon)
		const localOrderIndex = orders.findIndex(o => o.code === activeVerificationOrder.order_number);
		if (localOrderIndex !== -1) {
			orders[localOrderIndex].tags = `Teyit_${outcome}`;
			if (newAddress && outcome === 'ADRES_GUNCELLEDNDI') {
				orders[localOrderIndex].address = `${newAddress.address1}, ${newAddress.address2 ? newAddress.address2 + ', ' : ''}${newAddress.city}, ${newAddress.province}`;
			}
		}
		
		showNotification(`[DEMO MODU] Teyit sonucu kaydedildi: ${outcome}`, 'success');
	}
	
	// Arayüzü sıfırla
	initVerificationView();
}

// ==========================================================================
// 23. BİLDİRİM VE SSS MODAL FONKSİYONLARI (NOTIFICATION & FAQ MODAL LOGIC)
// ==========================================================================

function toggleNotificationDropdown(event) {
	if (event) event.stopPropagation();
	const dropdown = document.getElementById('notification-dropdown');
	if (!dropdown) return;
	
	if (dropdown.style.display === 'none' || dropdown.style.display === '') {
		dropdown.style.display = 'flex';
	} else {
		dropdown.style.display = 'none';
	}
}

function closeNotificationDropdown() {
	const dropdown = document.getElementById('notification-dropdown');
	if (dropdown) dropdown.style.display = 'none';
}

function markAllNotificationsAsRead(event) {
	if (event) {
		event.preventDefault();
		event.stopPropagation();
	}
	
	const unreadItems = document.querySelectorAll('.noti-item.unread');
	unreadItems.forEach(item => {
		item.classList.remove('unread');
	});
	
	const badge = document.getElementById('noti-badge-dot');
	if (badge) {
		badge.style.display = 'none';
	}
	
	showNotification('Tüm bildirimler okundu olarak işaretlendi.', 'success');
}

function checkUnreadCount() {
	const unread = document.querySelectorAll('.noti-item.unread');
	const badge = document.getElementById('noti-badge-dot');
	if (badge) {
		if (unread.length === 0) {
			badge.style.display = 'none';
		} else {
			badge.style.display = 'block';
		}
	}
}

// SSS Modalı Aç/Kapat
function openFaqModal() {
	const modal = document.getElementById('faq-modal');
	if (modal) modal.style.display = 'flex';
}

function closeFaqModal() {
	const modal = document.getElementById('faq-modal');
	if (modal) modal.style.display = 'none';
}

// ==========================================================================
// 24. ADRES DEFTERİ MANTIĞI (ADDRESS BOOK LOGIC)
// ==========================================================================

const savedSenderAddresses = [
	{ name: 'Nestro Teknoloji A.Ş.', phone: '0212 555 1234', city: 'İstanbul', district: 'Kağıthane', address: 'Merkez Mah. Ayazma Cad. No:12 Kat:4' },
	{ name: 'Kerem Can Altıntaş', phone: '0532 111 2233', city: 'Ankara', district: 'Çankaya', address: 'Atatürk Bulvarı No:85 Daire:12' },
	{ name: 'Lojistik Depo Yönetimi', phone: '0216 777 8899', city: 'Kocaeli', district: 'Gebze', address: 'Güzeller OSB Cumhuriyet Cad. No:50' }
];

const savedReceiverAddresses = [
	{ name: 'Nestro Depo Kağıthane', phone: '0212 999 5678', city: 'İstanbul', district: 'Kağıthane', address: 'Cendere Cad. No:105 Depo No:3' },
	{ name: 'Nestro Lojistik Tuzla', phone: '0216 444 9876', city: 'İstanbul', district: 'Tuzla', address: 'Orhanlı Org. San. Bölgesi 3. Cad. No:20' },
	{ name: 'Merkez Dağıtım Acentesi', phone: '0312 333 4455', city: 'Ankara', district: 'Yenimahalle', address: 'Macun Mah. 250. Sokak No:15/A' }
];

function openAddressBookModal(type) {
	const modal = document.getElementById('address-book-modal');
	const title = document.getElementById('address-book-title');
	const targetInput = document.getElementById('address-book-target-type');
	const listContainer = document.getElementById('address-book-list');
	
	if (!modal || !title || !targetInput || !listContainer) return;
	
	targetInput.value = type;
	title.innerHTML = `<i class="fa-solid fa-address-book"></i> Adres Defteri - ${type === 'sender' ? 'Gönderici' : 'Alıcı'} Seçimi`;
	
	const addresses = type === 'sender' ? savedSenderAddresses : savedReceiverAddresses;
	listContainer.innerHTML = '';
	
	addresses.forEach((addr, idx) => {
		const item = document.createElement('div');
		item.className = 'address-book-item';
		item.style.cssText = `
			border: 1px solid var(--border-color);
			border-radius: var(--radius-md);
			padding: 14px;
			display: flex;
			justify-content: space-between;
			align-items: center;
			transition: all 0.2s;
			cursor: pointer;
			background: #ffffff;
			margin-bottom: 8px;
		`;
		
		item.innerHTML = `
			<div style="text-align: left; padding-right: 12px;">
				<h4 style="margin: 0 0 4px 0; font-size: 13.5px; font-weight: 700; color: var(--text-primary);">${escapeHTML(addr.name)}</h4>
				<div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 2px;">
					<i class="fa-solid fa-phone" style="font-size: 10px; color: var(--primary); margin-right: 4px;"></i> ${escapeHTML(addr.phone)}
				</div>
				<div style="font-size: 11.5px; color: var(--text-muted); line-height: 1.4;">
					${escapeHTML(addr.address)}, ${escapeHTML(addr.district)}/${escapeHTML(addr.city)}
				</div>
			</div>
			<button type="button" class="btn-secondary" style="padding: 6px 12px; font-size: 12px; margin: 0; background: var(--primary-light) !important; color: var(--primary) !important; border-color: transparent !important; font-weight: 700; flex-shrink: 0;">Seç</button>
		`;
		
		item.onclick = () => selectAddressBookItem(idx);
		listContainer.appendChild(item);
	});
	
	modal.style.display = 'flex';
}

function closeAddressBookModal() {
	const modal = document.getElementById('address-book-modal');
	if (modal) modal.style.display = 'none';
}

function selectAddressBookItem(idx) {
	const type = document.getElementById('address-book-target-type').value;
	const addresses = type === 'sender' ? savedSenderAddresses : savedReceiverAddresses;
	const addr = addresses[idx];
	
	if (!addr) return;
	
	if (type === 'sender') {
		const nameInput = document.getElementById('sender-name');
		const phoneInput = document.getElementById('sender-phone');
		const cityInput = document.getElementById('sender-city');
		const distInput = document.getElementById('sender-district');
		const addrInput = document.getElementById('sender-address');
		
		if (nameInput) nameInput.value = addr.name;
		if (phoneInput) phoneInput.value = addr.phone;
		if (cityInput) cityInput.value = addr.city;
		if (distInput) distInput.value = addr.district;
		if (addrInput) addrInput.value = addr.address;
	} else {
		const nameInput = document.getElementById('receiver-name');
		const phoneInput = document.getElementById('receiver-phone');
		const cityInput = document.getElementById('receiver-city');
		const distInput = document.getElementById('receiver-district');
		const addrInput = document.getElementById('receiver-address');
		
		if (nameInput) nameInput.value = addr.name;
		if (phoneInput) phoneInput.value = addr.phone;
		if (cityInput) cityInput.value = addr.city;
		if (distInput) distInput.value = addr.district;
		if (addrInput) addrInput.value = addr.address;
	}
	
	closeAddressBookModal();
	showNotification(`${type === 'sender' ? 'Gönderici' : 'Alıcı'} adresi başarıyla yüklendi.`, 'success');
}

// ==========================================================================
// 25. DETAYLI ADRES DEFTERİ YÖNETİM SAYFASI (ADDRESS BOOK PAGE MANAGEMENT)
// ==========================================================================

let addressBookTab = 'depot'; // 'depot' veya 'receiver'
let addressBookSearchQuery = '';

let addressBookAddresses = [
	{
		id: 'addr-1',
		type: 'depot',
		title: 'Veliora Depo',
		addressNo: '46220',
		name: 'Veliora',
		phone: '+90 505 091 62 28',
		email: 'ahmetkutsimuhsinoglu@gmail.com',
		country: 'TR',
		city: 'Aydın',
		district: 'Söke',
		address: 'Konak Mahallesi Yıldırım Sokak No:32B',
		isMain: true
	},
	{
		id: 'addr-2',
		type: 'depot',
		title: 'giyimkent aras',
		addressNo: '75408',
		name: 'Veliora',
		phone: '+90 539 824 53 93',
		email: '',
		country: 'TR',
		city: 'İstanbul',
		district: 'Esenler',
		address: 'Oruçreis Mah., Giyimkent 16. Sk. No: 38',
		isMain: false
	},
	{
		id: 'addr-3',
		type: 'depot',
		title: 'tekstilkent aras',
		addressNo: '75391',
		name: 'Veliora',
		phone: '+90 539 824 53 93',
		email: '',
		country: 'TR',
		city: 'İstanbul',
		district: 'Esenler',
		address: 'Oruçreis Mahallesi, Tekstilkent Caddesi, No: 10 Tekstilkent Sitesi (A14 Blok), No: H/106, Aras Kargo Massit Şubesi',
		isMain: false
	},
	{
		id: 'addr-4',
		type: 'receiver',
		title: 'Nestro Kağıthane Merkez',
		addressNo: '22145',
		name: 'Nestro Depo Kağıthane',
		phone: '+90 212 999 5678',
		email: 'depo@nestro.com',
		country: 'TR',
		city: 'İstanbul',
		district: 'Kağıthane',
		address: 'Cendere Cad. No:105 Depo No:3',
		isMain: true
	},
	{
		id: 'addr-5',
		type: 'receiver',
		title: 'Nestro Tuzla Lojistik',
		addressNo: '33201',
		name: 'Nestro Lojistik Tuzla',
		phone: '+90 216 444 9876',
		email: 'tuzla@nestro.com',
		country: 'TR',
		city: 'İstanbul',
		district: 'Tuzla',
		address: 'Orhanlı Org. San. Bölgesi 3. Cad. No:20',
		isMain: false
	}
];

function initAddressBookView() {
	addressBookSearchQuery = '';
	const searchInput = document.getElementById('address-book-search-input');
	if (searchInput) {
		searchInput.value = '';
		searchInput.placeholder = addressBookTab === 'depot' ? 'Depo Konumu Ara...' : 'Alıcı Konumu Ara...';
	}
	renderAddressBookCards();
}

function switchAddressBookTab(tabType) {
	addressBookTab = tabType;
	
	const btnDepot = document.getElementById('tab-depot-locations');
	const btnReceiver = document.getElementById('tab-receiver-locations');
	const searchInput = document.getElementById('address-book-search-input');
	
	if (btnDepot && btnReceiver) {
		if (tabType === 'depot') {
			btnDepot.classList.add('active');
			btnReceiver.classList.remove('active');
			if (searchInput) searchInput.placeholder = 'Depo Konumu Ara...';
		} else {
			btnReceiver.classList.add('active');
			btnDepot.classList.remove('active');
			if (searchInput) searchInput.placeholder = 'Alıcı Konumu Ara...';
		}
	}
	
	renderAddressBookCards();
}

function handleAddressBookSearch(query) {
	addressBookSearchQuery = query.toLowerCase().trim();
	renderAddressBookCards();
}

function renderAddressBookCards() {
	const grid = document.getElementById('address-book-cards-grid');
	if (!grid) return;
	
	grid.innerHTML = '';
	
	const filtered = addressBookAddresses.filter(addr => {
		if (addr.type !== addressBookTab) return false;
		if (addressBookSearchQuery === '') return true;
		
		return addr.title.toLowerCase().includes(addressBookSearchQuery) ||
			addr.name.toLowerCase().includes(addressBookSearchQuery) ||
			addr.city.toLowerCase().includes(addressBookSearchQuery) ||
			addr.district.toLowerCase().includes(addressBookSearchQuery);
	});
	
	if (filtered.length === 0) {
		grid.innerHTML = `
			<div style="grid-column: 1 / -1; padding: 40px; text-align: center; color: var(--text-muted);">
				<i class="fa-solid fa-folder-open" style="font-size: 32px; margin-bottom: 12px; display: block; color: var(--text-muted);"></i>
				Kayıtlı adres bulunamadı.
			</div>
		`;
		return;
	}
	
	filtered.forEach(addr => {
		const card = document.createElement('div');
		card.className = `address-card ${addr.isMain ? 'is-main' : ''}`;
		
		let mainBadge = '';
		let actionButton = '';
		let deleteButton = '';
		
		if (addr.isMain) {
			mainBadge = `<span style="background: rgba(16, 185, 129, 0.12); color: #10b981; padding: 4px 10px; border-radius: var(--radius-sm); font-size: 11px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-check"></i> Ana Depo</span>`;
		} else {
			actionButton = `<button class="btn-address-action" onclick="setMainAddress('${addr.id}')">Ana Depo Yap</button>`;
			deleteButton = `<button class="address-delete-btn" onclick="deleteAddress('${addr.id}')"><i class="fa-regular fa-trash-can"></i></button>`;
		}
		
		card.innerHTML = `
			<div>
				<div class="address-card-header">
					<div class="address-card-title">
						<i class="fa-solid fa-house-chimney" style="color: var(--primary);"></i> ${escapeHTML(addr.title)}
					</div>
					<div style="display: flex; align-items: center; gap: 8px;">
						${mainBadge}
						${deleteButton}
					</div>
				</div>
				<div class="address-card-details">
					<div class="address-card-detail-item">
						<i class="fa-solid fa-hashtag"></i>
						<span><strong>Adres No:</strong> ${escapeHTML(addr.addressNo)}</span>
					</div>
					<div class="address-card-detail-item">
						<i class="fa-regular fa-user"></i>
						<span><strong>Gönderici Adı:</strong> ${escapeHTML(addr.name)}</span>
					</div>
					<div class="address-card-detail-item">
						<i class="fa-solid fa-phone"></i>
						<span><strong>Gönderici Telefonu:</strong> ${escapeHTML(addr.phone)}</span>
					</div>
					<div class="address-card-detail-item">
						<i class="fa-regular fa-envelope"></i>
						<span><strong>Gönderici E-Postası:</strong> ${escapeHTML(addr.email || 'Belirtilmemiş')}</span>
					</div>
					<div class="address-card-detail-item">
						<i class="fa-regular fa-flag"></i>
						<span><strong>Gönderici Ülkesi:</strong> ${escapeHTML(addr.country)}</span>
					</div>
					<div class="address-card-detail-item">
						<i class="fa-solid fa-location-dot"></i>
						<span><strong>Gönderici İli:</strong> ${escapeHTML(addr.city)}</span>
					</div>
					<div class="address-card-detail-item">
						<i class="fa-solid fa-map-pin"></i>
						<span><strong>Gönderici İlçesi:</strong> ${escapeHTML(addr.district)}</span>
					</div>
					<div class="address-card-detail-item">
						<i class="fa-regular fa-map"></i>
						<span><strong>Gönderici Adresi:</strong> ${escapeHTML(addr.address)}</span>
					</div>
				</div>
			</div>
			<div style="margin-top: auto;">
				${actionButton}
			</div>
		`;
		
		grid.appendChild(card);
	});
}

function setMainAddress(id) {
	addressBookAddresses.forEach(addr => {
		if (addr.type === addressBookTab) {
			addr.isMain = (addr.id === id);
		}
	});
	renderAddressBookCards();
	showNotification('Seçilen adres birincil depo konumu olarak ayarlandı.', 'success');
}

function deleteAddress(id) {
	if (confirm('Bu adresi silmek istediğinize emin misiniz?')) {
		addressBookAddresses = addressBookAddresses.filter(addr => addr.id !== id);
		renderAddressBookCards();
		showNotification('Adres başarıyla silindi.', 'success');
	}
}

// Yeni adres modalı tetikleyicileri
function handleAddNewAddressPrompt() {
	const modal = document.getElementById('add-address-modal');
	const typeSelect = document.getElementById('new-addr-type');
	const form = document.getElementById('add-address-form');
	
	if (modal && typeSelect && form) {
		form.reset();
		typeSelect.value = addressBookTab; // Aktif sekmeyi seçili getir
		modal.style.display = 'flex';
	}
}

function closeAddAddressModal() {
	const modal = document.getElementById('add-address-modal');
	if (modal) modal.style.display = 'none';
}

function saveNewAddress(event) {
	event.preventDefault();
	
	const type = document.getElementById('new-addr-type').value;
	const title = document.getElementById('new-addr-title').value;
	const name = document.getElementById('new-addr-name').value;
	const phone = document.getElementById('new-addr-phone').value;
	const city = document.getElementById('new-addr-city').value;
	const district = document.getElementById('new-addr-district').value;
	const address = document.getElementById('new-addr-detail').value;
	
	const addressNo = Math.floor(10000 + Math.random() * 90000).toString();
	const id = 'addr-' + Date.now();
	
	// Eğer ilk adresteyse veya isMain seçeneği yoksa şimdilik false, eğer bu tipte başka adres yoksa main yap
	const hasAnyOfThisType = addressBookAddresses.some(addr => addr.type === type);
	
	const newAddr = {
		id,
		type,
		title,
		addressNo,
		name,
		phone,
		email: '',
		country: 'TR',
		city,
		district,
		address,
		isMain: !hasAnyOfThisType
	};
	
	addressBookAddresses.push(newAddr);
	closeAddAddressModal();
	renderAddressBookCards();
	showNotification('Yeni adres başarıyla kaydedildi.', 'success');
}





