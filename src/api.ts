import {useRouter} from './router'

export function useQuery() {
    const {location: {search}} = useRouter()
    return new URLSearchParams(search)
}