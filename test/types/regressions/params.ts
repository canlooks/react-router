import type {useParams} from '@canlooks/react-router'

// Runtime captures duplicate names as string[], so consumers must be allowed to represent that value.
export const captured: ReturnType<typeof useParams> = {id: ['one', 'two']}
