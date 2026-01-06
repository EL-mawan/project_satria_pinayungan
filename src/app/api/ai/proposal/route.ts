import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { type, subject, recipient } = await request.json()

    let content = ""

    if (type === 'background') {
      const templates = [
        `Kebudayaan dan seni bela diri merupakan warisan luhur bangsa yang perlu dijaga kelestariannya. Padepokan Satria Pinayungan Ragas Grenyang hadir sebagai wadah pembinaan generasi muda untuk membentuk karakter yang kuat, disiplin, dan berakhlak mulia melalui seni ketangkasan dan spiritual.\n\nDalam rangka mendukung kegiatan "${subject}" yang ditujukan kepada ${recipient}, kami memandang perlu adanya peningkatan sarana dan prasarana. Saat ini, kondisi operasional kami membutuhkan dukungan lebih lanjut untuk dapat mengakomodasi antusiasme anggota yang terus meningkat. Inisiatif ini bertujuan untuk memastikan profesionalisme dan keberlanjutan program kerja Padepokan di masa mendatang.`,
        
        `Membangun generasi muda yang berkarakter, mandiri, dan cinta budaya adalah visi utama Padepokan Satria Pinayungan Ragas Grenyang. Seni bela diri pencak silat bukan sekadar olahraga, melainkan sarana pendidikan mental dan spiritual.\n\nSehubungan dengan proposal "${subject}", kami mengajukan permohonan kerjasama kepada ${recipient}. Kami percaya bahwa dukungan fasilitas yang memadai akan berbanding lurus dengan prestasi dan kualitas latihan para santri padepokan. Keterbatasan sarana saat ini menjadi tantangan yang kami harap dapat terselesaikan melalui dukungan Bapak/Ibu.`,
        
        `Padepokan Satria Pinayungan Ragas Grenyang berkomitmen melestarikan seni budaya lokal sebagai identitas bangsa. Antusiasme pemuda di lingkungan kami sangat tinggi, namun seringkali terkendala oleh minimnya fasilitas penunjang.\n\nMelalui proposal "${subject}" ini, kami berharap ${recipient} dapat turut andil dalam memajukan kebudayaan daerah. Peningkatan sarana prasarana akan berdampak langsung pada efektivitas latihan dan syiar budaya yang kami lakukan, sehingga nilai-nilai luhur dapat terus diwariskan kepada generasi penerus.`
      ];
      content = templates[Math.floor(Math.random() * templates.length)];

    } else if (type === 'objectives') {
      const templates = [
        [
          `Meningkatkan kualitas sarana pendukung kegiatan "${subject}" agar lebih optimal.`,
          `Menfasilitasi bakat dan minat generasi muda di lingkungan sekitar dalam bidang seni budaya.`,
          `Meningkatkan standar profesionalisme organisasi dalam setiap pelaksanaan acara.`,
          `Membangun sinergi yang positif antara Padepokan dengan pihak ${recipient}.`,
          `Memastikan keberlanjutan warisan budaya silat melalui fasilitas yang memadai.`
        ],
        [
          `Mewujudkan kegiatan "${subject}" yang sukses dan berdampak luas bagi masyarakat.`,
          `Memberikan ruang ekspresi yang layak bagi para pegiat seni dan budaya muda.`,
          `Mempererat tali silaturahmi antara Padepokan Satria Pinayungan dengan ${recipient}.`,
          `Mendorong kemandirian organisasi dalam mengelola event dan kegiatan rutin.`,
          `Melestarikan nilai-nilai tradisi melalui dukungan infrastruktur yang modern.`
        ],
        [
          `Optimalisasi pembinaan prestasi atlet dan pegiat seni melalui sarana yang standar.`,
          `Sebagai wujud nyata dukungan terhadap program "${subject}" yang berkelanjutan.`,
          `Membangun citra positif lembaga dan mitra pendukung di mata masyarakat luas.`,
          `Mengatasi kendala teknis operasional yang selama ini menghambat laju perkembangan padepokan.`,
          `Menciptakan ekosistem kebudayaan yang dinamis dan didukung penuh oleh stakeholder terkait.`
        ]
      ];
      content = JSON.stringify(templates[Math.floor(Math.random() * templates.length)]);

    } else if (type === 'cover-letter') {
      const templates = [
        `Assalamualaikum. Wr. Wb.

Salam silaturahmi kami sampaikan, teriring doa semoga Bapak/Ibu ${recipient} beserta keluarga dan jajaran selalu berada dalam lindungan Allah SWT, diberikan kesehatan, serta kelancaran dalam segala urusan.

Kami, pengurus Padepokan Satria Pinayungan Ragas Grenyang, bermaksud mengajukan permohonan dukungan terkait "${subject}". Seiring dengan berkembangnya kegiatan pembinaan seni budaya di lingkungan kami, kebutuhan akan sarana penunjang menjadi semakin krusial demi optimalnya proses latihan dan syiar budaya.

Besar harapan kami agar Bapak/Ibu berkenan mempertimbangkan permohonan ini sebagai wujud kepedulian terhadap kelestarian seni budaya tradisional warisan leluhur. Dukungan Bapak/Ibu akan menjadi motivasi besar bagi kami dan generasi muda di Padepokan.

Demikian surat permohonan ini kami sampaikan. Atas perhatian dan kerjasamanya kami haturkan terima kasih.

Wassalamu a'laikum wr.wb`,

        `Assalamualaikum. Wr. Wb.

Puji syukur kita panjatkan ke hadirat Allah SWT. Semoga Bapak/Ibu ${recipient} senantiasa dalam keadaan sehat walafiat dan sukses dalam menjalankan aktivitas sehari-hari.

Bersama surat ini, kami dari Padepokan Satria Pinayungan Ragas Grenyang mengajukan proposal kegiatan "${subject}". Proposal ini kami susun didasari oleh semangat untuk terus memajukan seni budaya pencak silat di tengah masyarakat. Namun, semangat tersebut perlu didukung oleh fasilitas yang memadai agar hasil yang dicapai dapat lebih maksimal.

Kami sangat mengharapkan dukungan dan partisipasi dari Bapak/Ibu untuk merealisasikan rencana ini. Bantuan yang Bapak/Ibu berikan bukan sekadar materi, melainkan investasi bagi masa depan generasi muda dan pelestarian budaya bangsa.

Demikian permohonan ini kami buat. Atas perhatian dan perkenan Bapak/Ibu, kami ucapkan terima kasih yang sebesar-besarnya.

Wassalamu a'laikum wr.wb`,

        `Assalamualaikum. Wr. Wb.

Dengan hormat, teriring doa kami sampaikan semoga Bapak/Ibu ${recipient} selalu dalam lindungan Tuhan Yang Maha Esa dan diberkahi dalam setiap langkah pengabdiannya.

Kami selaku pengurus Padepokan Satria Pinayungan Ragas Grenyang datang dengan niat tulus untuk memohon dukungan atas program "${subject}". Kami menyadari bahwa pembinaan karakter generasi muda melalui seni budaya memerlukan kolaborasi dari berbagai pihak. Oleh karena itu, kami memberanikan diri untuk mengetuk hati Bapak/Ibu agar berkenan membantu kemudahan sarana prasarana kami.

Ketersediaan dukungan dari Bapak/Ibu akan menjadi energi baru bagi kami untuk terus berkarya dan berprestasi. Kami yakin, sinergi ini akan membawa manfaat kebaikan bagi lingkungan dan masyarakat luas.

Demikian proposal ini kami ajukan. Besar harapan kami untuk dapat diterima. Atas segala perhatiannya, kami sampaikan terima kasih.

Wassalamu a'laikum wr.wb`
      ];
      content = templates[Math.floor(Math.random() * templates.length)];
    } else if (type === 'closing') {
      const templates = [
        `Demikian proposal ini kami sampaikan. Besar harapan kami agar Bapak dapat membantu mewujudkan pengadaan alat sound system ini demi kemajuan kegiatan positif di lingkungan kita. Dukungan Bapak sangat berarti bagi kelestarian seni budaya tradisional di wilayah kami.\nAtas perhatian, dukungan, dan bantuan yang diberikan, kami keluarga besar Padepokan Satria Pinayungan Ragas Grenyang mengucapkan terima kasih yang sebesar-besarnya.`,
        
        `Demikian permohonan ini kami ajukan dengan harapan dapat terjalin kerjasama yang baik. Kami yakin bahwa setiap dukungan yang diberikan akan memberikan manfaat yang luas bagi pembinaan generasi muda.\nAtas segala perhatian dan bantuan Bapak/Ibu, kami sampaikan terima kasih dan penghargaan setinggi-tingginya.`,
        
        `Besar harapan kami usulan ini dapat diterima dan direalisasikan. Dukungan sarana dari Bapak/Ibu akan menjadi semangat baru bagi kami untuk terus berprestasi dan melestarikan budaya bangsa.\nAtas perkenan dan partisipasinya, kami ucapkan terima kasih. Semoga Allah SWT membalas kebaikan Bapak/Ibu dengan berlipat ganda.`
      ];
      content = templates[Math.floor(Math.random() * templates.length)];
    }

    // Simulate AI delay
    await new Promise(resolve => setTimeout(resolve, 1500))

    return NextResponse.json({ success: true, content })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to generate content' }, { status: 500 })
  }
}
