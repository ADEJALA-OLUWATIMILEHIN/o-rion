import { Toaster as Sonner, type ToasterProps } from 'sonner'

function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="top-center"
      toastOptions={{
        classNames: {
          toast: '!rounded-2xl !border-plum/5 !shadow-lift !font-sans',
          title: '!font-bold !text-plum',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
