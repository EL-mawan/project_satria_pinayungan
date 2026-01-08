
import React, { forwardRef } from 'react'

interface Pemasukan {
  id: string
  sumber: string
  tanggal: string
  nominal: number
  unitSumber?: string
  qty?: number
  keterangan?: string
}

interface Pengeluaran {
  id: string
  jenis: string
  tanggal: string
  nominal: number
  satuanHarga?: number
  qty?: number
  satuan?: string
  keterangan?: string
}

interface Summary {
  totalPemasukan: number
  totalPengeluaran: number
  saldo: number
}

interface LaporanPDFProps {
  pemasukanList: Pemasukan[]
  pengeluaranList: Pengeluaran[]
  summary: Summary
  namaKetua?: string
  namaBendahara?: string
  tanggalMulai?: string
  tanggalSelesai?: string
}

const LaporanPDF = forwardRef<HTMLDivElement, LaporanPDFProps>(({ 
  pemasukanList, 
  pengeluaranList, 
  summary, 
  namaKetua = "Sam'un", 
  namaBendahara = "Hikmatulloh",
  tanggalMulai,
  tanggalSelesai
}, ref) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatCurrencyValue = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = () => {
    return new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long', 
      year: 'numeric'
    })
  }

  const formatSimpleDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const d = String(date.getDate()).padStart(2, '0')
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const y = date.getFullYear()
    return `${d}/${m}/${y}`
  }

  const formatItemDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long', 
      year: 'numeric'
    })
  }

  // Common styles to ensure HEX colors
  const styles = {
    page: {
      backgroundColor: '#ffffff',
      color: '#000000',
      padding: '32px',
      width: '210mm',
      minHeight: '297mm',
      margin: '0 auto',
      fontFamily: 'serif',
      fontSize: '12px'
    },
    borderBlack: {
      borderColor: '#000000'
    },
    tableHeaderYellow: {
      backgroundColor: '#fde047', // Yellow 300
      color: '#000000',
      borderColor: '#000000'
    },
    tableHeaderBlue: {
      backgroundColor: '#bfdbfe', // Blue 200
      color: '#000000',
      borderColor: '#000000'
    },
    tableCell: {
      border: '1px solid #000000',
      padding: '6px 4px', // Increased padding
      verticalAlign: 'middle', // Align text vertically
      borderColor: '#000000'
    },
    tableCellItalic: {
      border: '1px solid #000000',
      padding: '8px',
      textAlign: 'center' as const,
      fontStyle: 'italic',
      borderColor: '#000000'
    }
  }

  const CurrencyData = ({ value }: { value: number }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
      <span>Rp</span>
      <span>{formatCurrencyValue(value)}</span>
    </div>
  )

  return (
    <div ref={ref} style={styles.page} id="laporan-pdf">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '4px solid #000000', paddingBottom: '2px', marginBottom: '24px' }}>
        <div style={{ width: '96px', height: '96px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/padepokan-logo.png" alt="Logo Padepokan" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <div style={{ textAlign: 'center', flex: 1, padding: '0 8px' }}>
          <h1 style={{ fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '2px', letterSpacing: '0.05em', lineHeight: '1.2' }}>PADEPOKAN SATRIA PINAYUNGAN RAGAS GRENYANG</h1>
          <h2 style={{ fontSize: '12px', fontWeight: '500', textTransform: 'uppercase', marginBottom: '0px', letterSpacing: '0.05em', lineHeight: '1.2' }}>KAMPUNG RAGAS GRENYANG DESA ARGAWANA</h2>
          <h3 style={{ fontSize: '12px', fontWeight: '500', textTransform: 'uppercase', marginBottom: '0px', letterSpacing: '0.05em', lineHeight: '1.2' }}>KECAMATAN PULOAMPEL KABUPATEN SERANG - BANTEN</h3>
          <p style={{ fontSize: '10px', fontStyle: 'italic', marginTop: '16px', letterSpacing: '0.02em' }}>Jl. Puloampel KM.19 Ds.Argawana Kode Pos 42455 / no.tlp 0819 1114 1616 - 0896 4756 5908</p>
        </div>
        {/* Placeholder for balance to ensure text remains centered */}
        <div style={{ width: '96px', height: '96px' }}></div>
      </div>
      
      {/* Document Title */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase', textDecoration: 'underline', marginBottom: '4px' }}>LAPORAN PENANGGUNG JAWABAN (LPJ)</h2>
        {(tanggalMulai && tanggalSelesai) && (
          <p style={{ fontSize: '14px', fontWeight: 'bold' }}>
            {formatSimpleDate(tanggalMulai)} - {formatSimpleDate(tanggalSelesai)}
          </p>
        )}
      </div>

      {/* A. PEMASUKAN */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '8px', textTransform: 'uppercase' }}>A. PEMASUKAN</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000000', fontSize: '12px' }}>
          <thead>
            <tr style={styles.tableHeaderYellow}>
              <th style={{ ...styles.tableCell, width: '40px', textAlign: 'center' }}>NO.</th>
              <th style={{ ...styles.tableCell, width: '100px', textAlign: 'center' }}>TANGGAL</th>
              <th style={{ ...styles.tableCell, textAlign: 'left' }}>SUMBER PEMASUKAN</th>
              <th style={{ ...styles.tableCell, width: '96px', textAlign: 'center' }}>UNIT SUMBER</th>
              <th style={{ ...styles.tableCell, width: '48px', textAlign: 'center' }}>Qty</th>
              <th style={{ ...styles.tableCell, width: '128px', textAlign: 'center' }}>Jumlah</th>
              <th style={{ ...styles.tableCell, textAlign: 'left' }}>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {pemasukanList.length > 0 ? (
              pemasukanList.map((item, index) => (
                <tr key={item.id}>
                  <td style={{ ...styles.tableCell, textAlign: 'center' }}>{index + 1}</td>
                  <td style={{ ...styles.tableCell, textAlign: 'center' }}>{formatItemDate(item.tanggal)}</td>
                  <td style={styles.tableCell}>{item.sumber}</td>
                  <td style={{ ...styles.tableCell, textAlign: 'center' }}>{item.unitSumber || '-'}</td>
                  <td style={{ ...styles.tableCell, textAlign: 'center' }}>{item.qty || '-'}</td>
                  <td style={styles.tableCell}>
                    <CurrencyData value={item.nominal} />
                  </td>
                  <td style={styles.tableCell}>{item.keterangan || '-'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} style={styles.tableCellItalic}>Tidak ada data pemasukan</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr style={{ fontWeight: 'bold' }}>
              <td colSpan={5} style={{ ...styles.tableCell, textAlign: 'right', verticalAlign: 'middle' }}>Total Pemasukan</td>
              <td style={styles.tableCell}>
                <CurrencyData value={summary.totalPemasukan} />
              </td>
              <td style={styles.tableCell}></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* B. PENGELUARAN */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '8px', textTransform: 'uppercase' }}>B. PENGELUARAN</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000000', fontSize: '12px' }}>
          <thead>
            <tr style={styles.tableHeaderBlue}>
              <th style={{ ...styles.tableCell, width: '40px', textAlign: 'center' }}>NO.</th>
              <th style={{ ...styles.tableCell, width: '100px', textAlign: 'center' }}>TANGGAL</th>
              <th style={{ ...styles.tableCell, textAlign: 'left' }}>Nama Barang</th>
              <th style={{ ...styles.tableCell, width: '96px', textAlign: 'center' }}>Satuan Harga</th>
              <th style={{ ...styles.tableCell, width: '48px', textAlign: 'center' }}>Qty</th>
              <th style={{ ...styles.tableCell, width: '64px', textAlign: 'center' }}>Satuan</th>
              <th style={{ ...styles.tableCell, width: '128px', textAlign: 'center' }}>Jumlah</th>
              <th style={{ ...styles.tableCell, textAlign: 'left' }}>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {pengeluaranList.length > 0 ? (
              pengeluaranList.map((item, index) => (
                <tr key={item.id}>
                  <td style={{ ...styles.tableCell, textAlign: 'center' }}>{index + 1}</td>
                  <td style={{ ...styles.tableCell, textAlign: 'center' }}>{formatItemDate(item.tanggal)}</td>
                  <td style={styles.tableCell}>{item.jenis}</td>
                  <td style={styles.tableCell}>
                    {item.satuanHarga ? <CurrencyData value={item.satuanHarga} /> : '-'}
                  </td>
                  <td style={{ ...styles.tableCell, textAlign: 'center' }}>{item.qty || '-'}</td>
                  <td style={{ ...styles.tableCell, textAlign: 'center' }}>{item.satuan || '-'}</td>
                  <td style={styles.tableCell}>
                     <CurrencyData value={item.nominal} />
                  </td>
                  <td style={styles.tableCell}>{item.keterangan || '-'}</td>
                </tr>
              ))
            ) : (
                <tr>
                  <td colSpan={8} style={styles.tableCellItalic}>Tidak ada data pengeluaran</td>
                </tr>
            )}
          </tbody>
          <tfoot>
            <tr style={{ fontWeight: 'bold' }}>
              <td colSpan={6} style={{ ...styles.tableCell, textAlign: 'right', verticalAlign: 'middle' }}>Total Anggaran</td>
              <td style={styles.tableCell}>
                 <CurrencyData value={summary.totalPengeluaran} />
              </td>
              <td style={styles.tableCell}></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* C. TOTAL DANA BERJALAN SEMENTARA */}
      <div style={{ marginBottom: '32px', width: '70%' }}>
        <h3 style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '8px', textTransform: 'uppercase' }}>C. TOTAL DANA BERJALAN SEMENTARA</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000000', fontSize: '12px' }}>
          <thead>
            <tr style={styles.tableHeaderYellow}>
              <th style={{ ...styles.tableCell, width: '40px', textAlign: 'center' }}>NO.</th>
              <th style={{ ...styles.tableCell, textAlign: 'center' }}>SUB PEMASUKAN (A)</th>
              <th style={{ ...styles.tableCell, width: '160px', textAlign: 'center' }}>SUB ( B )</th>
              <th style={{ ...styles.tableCell, width: '160px', textAlign: 'center' }}>SUB TOTAL</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ ...styles.tableCell, textAlign: 'center' }}>1</td>
              <td style={{ ...styles.tableCell, fontWeight: 'bold' }}>
                <CurrencyData value={summary.totalPemasukan} />
              </td>
              <td style={{ ...styles.tableCell, fontWeight: 'bold' }}>
                <CurrencyData value={summary.totalPengeluaran} />
              </td>
              <td style={{ ...styles.tableCell, fontWeight: 'bold', backgroundColor: '#f3f4f6' }}>
                <CurrencyData value={summary.saldo} />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Signatures */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '64px', padding: '0 48px' }}>
        <div style={{ textAlign: 'center', width: '220px' }}>
          <p style={{ marginBottom: '4px' }}>Mengetahui,</p>
          <p style={{ fontWeight: 'bold', marginBottom: '72px' }}>KETUA PADEPOKAN</p>
          <p style={{ fontWeight: 'bold', marginBottom: '0px' }}>{namaKetua}</p>
          <p style={{ marginTop: '-6px' }}>( ...................................... )</p>
        </div>
        
        <div style={{ textAlign: 'center', width: '220px' }}>
          <p style={{ marginBottom: '4px' }}>Argawana, {formatDate()}</p> 
          <p style={{ fontWeight: 'bold', marginBottom: '72px' }}>BENDAHARA</p>
          <p style={{ fontWeight: 'bold', marginBottom: '0px' }}>{namaBendahara}</p>
          <p style={{ marginTop: '-6px' }}>( ...................................... )</p>
        </div>
      </div>
    </div>
  )
})

LaporanPDF.displayName = 'LaporanPDF'

export default LaporanPDF
