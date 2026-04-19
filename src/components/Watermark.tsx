import styles from './Watermark.module.css'

export default function Watermark() {
  return (
    <div className={styles.watermark} aria-hidden="true" role="presentation">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className={styles.row}>
          {Array.from({ length: 4 }).map((_, j) => (
            <span key={j} className={styles.text}>
              AinSathi আইনসাথী
            </span>
          ))}
        </div>
      ))}
    </div>
  )
}
