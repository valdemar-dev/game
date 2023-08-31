import Image from 'next/image'

export default function Home() {
  return (
    <main className="main flex flex-col items-center justify-center gap-20">
      <div className="flex flex-row gap-5">
        <div className="flex flex-col gap-2 w-fit">
          <h2>Corvus</h2>
          <Image
            src={"/user.svg"}
            height="60"
            width="60"
            alt="Player icon"
          />
          hp: 20
        </div>

        <div className="flex flex-col gap-2 w-fit">
          <h2>Kara</h2>
          <Image
            src={"/user.svg"}
            height="60"
            width="60"
            alt="Player icon"
          />
          hp: 20
        </div>

        <div className="flex flex-col gap-2 w-fit">
          <h2>Mercy</h2>
          <Image
            src={"/user.svg"}
            height="60"
            width="60"
            alt="Player icon"
          />
          hp: 20
        </div>
      </div>

      <div className="flex flex-row gap-5">
        <div className="flex flex-col gap-2 w-fit">
          <h2>Jonathan</h2>
          <Image
            src={"/user.svg"}
            height="60"
            width="60"
            alt="Player icon"
          />
          hp: 20
        </div>

        <div className="flex flex-col gap-2 w-fit">
          <h2>Markus</h2>
          <Image
            src={"/user.svg"}
            height="60"
            width="60"
            alt="Player icon"
          />
          hp: 20
        </div>

        <div className="flex flex-col gap-2 w-fit">
          <h2>Tom</h2>
          <Image
            src={"/user.svg"}
            height="60"
            width="60"
            alt="Player icon"
          />
          hp: 20
        </div>
      </div>
    </main>
  )
}
