import {truncatePath} from '../src'

const truncated = truncatePath('/app/about/123', 'app')

console.log(truncated)