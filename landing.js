document.addEventListener('DOMContentLoaded', () => {
    let slideIndex = 0;
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    
    function showSlides() {
        // Alle Slides ausblenden
        slides.forEach(slide => {
            slide.classList.remove('active');
        });
        
        // Alle Dots deaktivieren
        dots.forEach(dot => {
            dot.classList.remove('active');
        });
        
        // Nächster Slide
        slideIndex++;
        if (slideIndex > slides.length) {
            slideIndex = 1;
        }
        
        // Aktuellen Slide und Dot aktivieren
        slides[slideIndex - 1].classList.add('active');
        dots[slideIndex - 1].classList.add('active');
        
        // Nach 5 Sekunden nächster Slide
        setTimeout(showSlides, 5500);
    }
    
    // Dots klickbar machen
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            slideIndex = index;
            showSlides();
        });
    });
    
    // Starte Slideshow
    showSlides();
}); 