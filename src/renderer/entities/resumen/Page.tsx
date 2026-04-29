import Main from '../../layout/Main'
import DashboardInsights from '../../components/DashboardInsights'

export default function PageResumen() {
  return (
    <Main className='flex flex-col min-h-0 p-2 sm:p-3 gap-2 outline-n text-white'>
      <div className="flex flex-col min-h-max outline-none focus:outline-none gap-2 md:h-full md:min-h-0">
        <DashboardInsights />
      </div>
    </Main>
  )
}
