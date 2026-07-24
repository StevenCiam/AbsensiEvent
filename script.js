document.addEventListener('DOMContentLoaded', () => {
    // 1. CEK PARAMETER URL (Membaca link spesifik event)
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('id');
    const eventTitle = urlParams.get('title');
    const eventDate = urlParams.get('date');
    const eventBanner = urlParams.get('banner');

    const errorScreen = document.getElementById('errorScreen');
    const mainFormScreen = document.getElementById('mainFormScreen');

    // Jika buka tanpa link spesifik event
    if (!eventId || !eventTitle) {
        if (errorScreen) errorScreen.style.display = 'flex';
        if (mainFormScreen) mainFormScreen.style.display = 'none';
        return;
    }

    // Tampilkan Form
    if (errorScreen) errorScreen.style.display = 'none';
    if (mainFormScreen) mainFormScreen.style.display = 'block';
    
    const displayEventName = document.getElementById('displayEventName');
    const displayEventDate = document.getElementById('displayEventDate');
    if (displayEventName) displayEventName.innerText = eventTitle;
    if (displayEventDate) displayEventDate.innerText = eventDate || 'Event';
    document.title = `Absensi | ${eventTitle}`;

    // === BANNER ACARA ===
    const bannerWrapper = document.getElementById('bannerWrapper');
    const eventBannerImg = document.getElementById('eventBannerImg');

    if (eventBanner && bannerWrapper && eventBannerImg) {
        eventBannerImg.src = eventBanner;
        bannerWrapper.style.display = 'block';
    } else if (bannerWrapper) {
        bannerWrapper.style.display = 'none';
    }

    // 2. LOGIKA AUTO-FILL BERDASARKAN NIM (KHUSUS PER EVENT INI)
    const form = document.getElementById('attendanceForm');
    const submitBtn = document.getElementById('submitBtn');
    
    const nimInput = document.getElementById('nim');
    const namaInput = document.getElementById('nama');
    const emailInput = document.getElementById('email');
    const kelasInput = document.getElementById('kelas');
    const telpInput = document.getElementById('telepon');
    
    // AMBIL DATABASE PESERTA KHUSUS EVENT INI
    const dbPeserta = JSON.parse(localStorage.getItem(`db_peserta_${eventId}`)) || [];

    // Deteksi ketikan NIM
    if (nimInput) {
        nimInput.addEventListener('input', (e) => {
            const cariNim = e.target.value.trim();
            const dataMatch = dbPeserta.find(p => p.nim.toString().trim() === cariNim);

            if (dataMatch) {
                if (namaInput) namaInput.value = dataMatch.nama || '';
                if (emailInput) emailInput.value = dataMatch.email || '';
                if (kelasInput) kelasInput.value = dataMatch.kelas || '';
                if (telpInput) telpInput.value = dataMatch.wa || dataMatch.telepon || '';
            } else {
                if (namaInput) namaInput.value = '';
                if (emailInput) emailInput.value = '';
                if (kelasInput) kelasInput.value = '';
                if (telpInput) telpInput.value = '';
            }
        });
    }

    // 3. LOGIKA SUBMIT FORM (DENGAN CEK DUPLIKASI ABSENSI)
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const nimVal = nimInput.value.trim();

            // Cek 1: Validasi apakah NIM terdaftar di database event ini
            if(!namaInput || !namaInput.value) {
                alert("NIM Anda tidak terdaftar pada event ini. Pastikan Anda sudah terdaftar di database event ini.");
                return;
            }

            // Cek 2: Validasi apakah NIM ini SUDAH PERNAH ABSEN di event ini
            const dataKehadiran = JSON.parse(localStorage.getItem('kehadiran_event')) || [];
            const sudahAbsen = dataKehadiran.some(k => k.eventId === eventId && k.nim.toString().trim() === nimVal);

            if (sudahAbsen) {
                alert(`⚠️ NIM ${nimVal} (${namaInput.value}) SUDAH melakukan absensi pada event ini! Anda hanya bisa melakukan absensi 1 kali.`);
                return;
            }

            // Jalankan proses simpan absensi
            if (submitBtn) submitBtn.disabled = true;
            const btnText = document.getElementById('btnText');
            const btnLoader = document.getElementById('btnLoader');
            
            if (btnText) btnText.style.display = 'none';
            if (btnLoader) btnLoader.style.display = 'block';

            const waktuSekarang = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            
            dataKehadiran.push({
                eventId: eventId,
                eventTitle: eventTitle,
                nim: nimVal,
                nama: namaInput.value,
                kelas: kelasInput.value,
                waktu: waktuSekarang
            });
            
            localStorage.setItem('kehadiran_event', JSON.stringify(dataKehadiran));

            setTimeout(() => {
                form.style.display = 'none';
                const successMsg = document.getElementById('successMessage');
                if (successMsg) successMsg.classList.remove('hidden');
                
                if (submitBtn) submitBtn.disabled = false;
                if (btnText) btnText.style.display = 'block';
                if (btnLoader) btnLoader.style.display = 'none';
            }, 800);
        });
    }

    // 4. RESET FORM
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            form.reset();
            const successMsg = document.getElementById('successMessage');
            if (successMsg) successMsg.classList.add('hidden');
            form.style.display = 'block';
            if (nimInput) nimInput.focus();
        });
    }
});