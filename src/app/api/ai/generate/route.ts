import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { field, tone = 'formal', eventDetails } = await req.json()

    // Simulation of AI generation (Deepmind/Gemini-like behavior)
    // We return a list of variations so the user can cycle through them.
    
    let variations: string[] = []

    if (field === 'pembuka') {
      variations = [
        // 1. Islamic / Semi-Formal (Warm & Respectful)
        "Assalamualaikum Wr. Wb.\n\nSalam silaturahmi kami sampaikan, teriring doa semoga Bapak/Ibu beserta keluarga senantiasa berada dalam lindungan Allah SWT, diberikan kesehatan, serta kelancaran dalam menjalankan aktivitas sehari-hari.",
        
        // 2. Formal Standard
        "Dengan hormat,\n\nSehubungan dengan akan dilaksanakannya kegiatan di Padepokan Satria Pinayungan, kami bermaksud mengundang Bapak/Ibu untuk dapat hadir pada acara tersebut.",
        
        // 3. Professional & Direct
        "Yth. Bapak/Ibu,\n\nMelalui surat ini, kami dari pengurus Padepokan Satria Pinayungan bermaksud menyampaikan undangan resmi terkait penyelenggaraan acara rutin kami.",

        // 4. Respectful & Polite
        "Assalamualaikum Wr. Wb.\n\nDengan penuh rasa hormat, kami memohon kehadiran Bapak/Ibu untuk berpartisipasi dalam acara yang akan kami selenggarakan di Padepokan.",

        // 5. Short & Concise
        "Dengan ini kami mengundang Bapak/Ibu untuk menghadiri acara Padepokan Satria Pinayungan yang akan diselenggarakan pada:"
      ]
    } else if (field === 'penutup') {
      variations = [
        // 1. Islamic / Semi-Formal
        "Demikian undangan ini kami sampaikan. Besar harapan kami agar Bapak/Ibu dapat meluangkan waktu untuk hadir. Atas perhatian dan kehadirannya, kami haturkan terima kasih.\n\nWassalamu'alaikum Wr. Wb.",
        
        // 2. Formal Standard
        "Demikian surat undangan ini kami sampaikan. Kami sangat mengharapkan kehadiran Bapak/Ibu pada waktu yang telah ditentukan. Atas perhatian dan kerjasamanya, kami ucapkan terima kasih.",
        
        // 3. Empathetic / Expectant
        "Kehadiran Bapak/Ibu merupakan kehormatan dan kebahagiaan tersendiri bagi kami. Demikian undangan ini, atas perhatiannya kami ucapkan terima kasih.",

        // 4. Short / Direct
        "Mengingat pentingnya acara ini, kami memohon kehadiran Bapak/Ibu tepat pada waktunya. Atas perhatiannya diucapkan terima kasih.",

        // 5. Professional Closing
        "Demikian undangan ini kami sampaikan. Atas perhatian dan partisipasi Bapak/Ibu, kami ucapkan terima kasih."
      ]
    }

    // Simulate network delay for realistic AI feel
    await new Promise(resolve => setTimeout(resolve, 800))

    return NextResponse.json({ 
      // Return the first one as default 'text'
      text: variations[0] || '',
      // Return all variations so frontend can cycle
      variations 
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate text' },
      { status: 500 }
    )
  }
}
