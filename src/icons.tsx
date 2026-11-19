type Name = 'arrow' | 'left' | 'right' | 'down' | 'play' | 'close' | 'flag' | 'trophy' | 'clock' | 'globe' | 'external'

const paths: Record<Name, string> = {
  arrow: 'M4 12h15m-6-6 6 6-6 6',
  left: 'm15 5-7 7 7 7',
  right: 'm9 5 7 7-7 7',
  down: 'M12 4v15m-6-6 6 6 6-6',
  play: 'm9 5 11 7-11 7z',
  close: 'm6 6 12 12M18 6 6 18',
  flag: 'M5 21V4m0 1c4-3 7 3 14 0v10c-7 3-10-3-14 0',
  trophy: 'M8 21h8m-4-4v4M8 3h8v8a4 4 0 0 1-8 0zM8 6H4v2a3 3 0 0 0 4 3m8-5h4v2a3 3 0 0 1-4 3',
  clock: 'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  globe: 'M3 12h18M12 3c-5 4-5 14 0 18 5-4 5-14 0-18Zm9 9a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  external: 'M14 4h6v6m0-6-9 9m7 0v7H4V6h7',
}

export function Icon({ name, size = 20 }: { name: Name; size?: number }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill={name === 'play' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name]} /></svg>
}

export function ApexMark() {
  return <svg aria-hidden="true" width="33" height="27" viewBox="0 0 36 28"><path fill="currentColor" d="M0 27 13 1h9L9 27zm15 0L28 1h8L23 27z" /></svg>
}
