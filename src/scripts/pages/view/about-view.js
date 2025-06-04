export default class AboutView {
  render() {
    return `
      <section class="container" style="padding: 40px 20px;">
        <div style="max-width: 1200px; margin: 0 auto;">
          <h1 style="text-align: center; margin-bottom: 40px; font-size: 2.5rem;">Tentang DiCerita</h1>
          <div style="display: flex; gap: 40px; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 300px;">
              <img
                src="https://images.unsplash.com/photo-1593398737367-bbc0298eed88"
                alt="Kucing lucu"
                style="width: 100%; height: 100%; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);"
              >
            </div>
            <div style="flex: 1; min-width: 300px;">
              <h2 style="color: #2c3e50; margin-bottom: 20px;">Platform Berbagi Cerita</h2>
              <p style="line-height: 1.6; margin-bottom: 20px;">
                DiCerita adalah platform untuk berbagi pengalaman hidup dan cerita inspiratif.
                Kami percaya setiap orang memiliki cerita berharga yang bisa menginspirasi orang lain.
              </p>
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 30px;">
                <h3 style="color: #2c3e50; margin-bottom: 15px;">Yuk Mulai Bercerita!</h3>
                <p style="line-height: 1.6;">
                  Gabung dengan komunitas kami dan bagikan pengalamanmu. Setiap cerita bisa menjadi
                  inspirasi bagi orang lain. Tidak perlu menjadi penulis profesional - yang penting
                  adalah ketulusan dan keinginan untuk berbagi.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }
}