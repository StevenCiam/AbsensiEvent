// ==========================================
// 📍 1. TEMPELKAN FIREBASE CONFIG ANDA DI SINI
// ==========================================
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC6EvpeR8hkZ-ZNQKRbbYj1SD6lU6eib8Q",
  authDomain: "absensi-event-2c22a.firebaseapp.com",
  projectId: "absensi-event-2c22a",
  storageBucket: "absensi-event-2c22a.firebasestorage.app",
  messagingSenderId: "652495354149",
  appId: "1:652495354149:web:abc5075b967730ec50c2cc",
  measurementId: "G-0YTHVFHPWX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);


document.addEventListener('DOMContentLoaded', () => {
    // CEK PARAMETER URL
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('id');
    const eventTitle = urlParams.get('title');
    const eventDate = urlParams.get('date');
    const eventBanner = urlParams.get('banner');

    const errorScreen = document.getElementById('errorScreen');
    const mainFormScreen = document.getElementById('mainFormScreen');

    if (!eventId || !eventTitle) {
        if (errorScreen) errorScreen.style.display = 'flex';
        if (mainFormScreen) mainFormScreen.style.display = 'none';
        return;
    }

    if (errorScreen) errorScreen.style.display = 'none';
    if (mainFormScreen) mainFormScreen.style.display = 'block';
    
    const displayEventName = document.getElementById('displayEventName');
    const displayEventDate = document.getElementById('displayEventDate');
    if (displayEventName) displayEventName.innerText = eventTitle;
    if (displayEventDate) displayEventDate.innerText = eventDate || 'Event';
    document.title = `Absensi | ${eventTitle}`;

    // BANNER ACARA
    const bannerWrapper = document.getElementById('bannerWrapper');
    const eventBannerImg = document.getElementById('eventBannerImg');

    if (eventBanner && bannerWrapper && eventBannerImg) {
        eventBannerImg.src = eventBanner;
        bannerWrapper.style.display = 'block';
    } else if (bannerWrapper) {
        bannerWrapper.style.display = 'none';
    }

    const form = document.getElementById('attendanceForm');
    const submitBtn = document.getElementById('submitBtn');
    
    const nimInput = document.getElementById('nim');
    const namaInput = document.getElementById('nama');
    const emailInput = document.getElementById('email');
    const kelasInput = document.getElementById('kelas');
    const telpInput = document.getElementById('telepon');

    // AUTO-FILL DATA PESERTA DARI FIREBASE FIRESTORE
    if (nimInput) {
        nimInput.addEventListener('input', async (e) => {
            const cariNim = e.target.value.trim();
            if (cariNim.length < 3) return;

            try {
                const snapshot = await db.collection('peserta')
                    .where('eventId', '==', eventId)
                    .where('nim', '==', cariNim)
                    .get();

                if (!snapshot.empty) {
                    const dataMatch = snapshot.docs[0].data();
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
            } catch (err) {
                console.error("Error fetching data:", err);
            }
        });
    }

    // SUBMIT FORM ABSENSI KE FIREBASE (CEK ABSEN 1 KALI PER NIM)
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const nimVal = nimInput.value.trim();

            if(!namaInput || !namaInput.value) {
                alert("NIM Anda tidak terdaftar pada event ini. Pastikan Anda sudah terdaftar.");
                return;
            }

            if (submitBtn) submitBtn.disabled = true;
            const btnText = document.getElementById('btnText');
            const btnLoader = document.getElementById('btnLoader');
            
            if (btnText) btnText.style.display = 'none';
            if (btnLoader) btnLoader.style.display = 'block';

            try {
                // 🛑 CEK VALIDASI: Apakah NIM sudah pernah absen di event ini
                const checkAbsen = await db.collection('absensi')
                    .where('eventId', '==', eventId)
                    .where('nim', '==', nimVal)
                    .get();

                if (!checkAbsen.empty) {
                    alert(`⚠️ NIM ${nimVal} (${namaInput.value}) SUDAH melakukan absensi pada event ini! Setiap peserta hanya bisa absen 1 kali.`);
                    resetButton();
                    return;
                }

                // SIMPAN KE DATABASE ONLINE FIRESTORE
                const waktuSekarang = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                
                await db.collection('absensi').add({
                    eventId: eventId,
                    eventTitle: eventTitle,
                    nim: nimVal,
                    nama: namaInput.value,
                    kelas: kelasInput.value,
                    waktu: waktuSekarang,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                form.style.display = 'none';
                const successMsg = document.getElementById('successMessage');
                if (successMsg) successMsg.classList.remove('hidden');

            } catch (err) {
                alert("Gagal melakukan absensi: " + err.message);
            } finally {
                resetButton();
            }
        });
    }

    function resetButton() {
        if (submitBtn) submitBtn.disabled = false;
        const btnText = document.getElementById('btnText');
        const btnLoader = document.getElementById('btnLoader');
        if (btnText) btnText.style.display = 'block';
        if (btnLoader) btnLoader.style.display = 'none';
    }

    // RESET FORM
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