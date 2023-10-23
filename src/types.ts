export type Parser<T> = (input: string) => ParseResult<T>


export type SuccessResult<T> = {
  success: true,
  value: T,
  rest: string,
}

export type ErrorResult = {
  success: false,
  error: string,
  rest: string,
}

export type ParseResult<T> = SuccessResult<T> | ErrorResult

export function is_success<T>(_: ParseResult<T>): _ is SuccessResult<T> {
  return _.success
}


export function constant<T>(result: T): Parser<T> {
  return (input: string) => ({ success: true, value: result, rest: input })
}

export function tag(str: string): Parser<string> {
  return (input: string) => {
    if (input.startsWith(str)) {
      return { success: true, value: str, rest: input.slice(str.length) }
    } else {
      return { success: false, error: `Expected ${str}`, rest: input }
    }
  }
}

export function regex(regex: RegExp): Parser<string> {
  return (input: string) => {

    const match = input.match(regex)
    if (match) {
      const value = match[0]
      return { success: true, value, rest: input.slice(value.length) }
    } else {
      return { success: false, error: `Failed to match regex: ${regex}`, rest: input }
    }
  }
}


export const unumber: Parser<number> = (input: string) => {
  const i_regex = /^\d+/

  const result = regex(i_regex)(input)

  if (result.success) {
    const value = parseInt(result.value!)
    return { success: true, value, rest: result.rest }
  } else {
    return { success: false, error: "No unsigned number", rest: input }
  }
}

export const newline: Parser<string> = (input: string) => {
  if (input[0] === '\n') {
    return { success: true, value: '\n', rest: input.slice(1) }
  } else {
    return { success: false, error: 'no newline', rest: input }
  }
}

export function many0<T>(ts: Parser<T>): Parser<T[]> {
  return (input: string) => {

    let res = []
    while (input.length > 0) {
      let t_res = ts(input)

      if (is_success(t_res)) {
        res.push(t_res.value)
        input = t_res.rest
      } else {
        break
      }
    }

    return { success: true, value: res, rest: input }
  }
}



export function many1<T>(ts: Parser<T>): Parser<T[]> {
  return (input: string) => {

    let res = []
    while (input.length > 0) {
      let t_res = ts(input)

      if (is_success(t_res)) {
        res.push(t_res.value)
        input = t_res.rest
      } else {
        break
      }
    }

    if (res.length > 1) {
      return { success: true, value: res, rest: input }
    } else {
      return { success: false, error: "no many 1", rest: input }
    }
  }
}

export function tuple(ts: Parser<any>[]): Parser<any[]> {
  return (input: string) => {
    let res = []
    for (let t of ts) {
      let t_res = t(input)

      if (is_success(t_res)) {
        res.push(t_res.value)
        input = t_res.rest
      } else {
        return { success: false, error: 'not a tuple', rest: input }
      }
    }
    return { success: true, value: res, rest: input }
  }
}


export function take_while1(fn: (_: string) => boolean): Parser<string> {
  return (input: string) => {
    let value = ''
    for (let c of input.split('')) {
      if (fn(c)) {
        value += c
      } else {
        break
      }
    }
    if (value.length > 1) {
      return { success: true, value, rest: input.slice(value.length) }
    } else {
      return { success: false, error: 'no take while', rest: input.slice(value.length) }
    }
  }
}

export function take_while(fn: (_: string) => boolean): Parser<string> {
  return (input: string) => {
    let value = ''
    for (let c of input.split('')) {
      if (fn(c)) {
        value += c
      } else {
        break
      }
    }
    return { success: true, value, rest: input.slice(value.length) }
  }
}


export function take_until(c: string): Parser<string> {
  return (input: string) => {
    let value = ''
    let i = input
    while (i.length === 0 || !i.startsWith(c)) {
      value += input[0]
      i = i.substring(1)
    }
    return { success: true, value, rest: input.slice(value.length) }
  }
}


export function alt<A, B>(a: Parser<A>, b: Parser<B>): Parser<A | B> {
  return (input: string) => {
    let a_res = a(input)
    if (is_success(a_res)) {
      return a_res
    } else {
      let b_res = b(input)
      if (is_success(b_res)) {
        return b_res
      } else {
        return { success: false, error: 'no alt match', rest: input }
      }
    }
  }
}