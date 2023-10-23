import { it, expect } from 'vitest'
import { ParseResult, alt, is_success, many0, many1, newline, tag, take_until, take_while, take_while1, tuple, unumber } from '../src'

const perft_case = `
# https://www.chessprogramming.org/Chess960_Perft_Results
# https://github.com/AndyGrant/Ethereal/blob/master/src/perft/fischer.epd

id 0
epd bqnb1rkr/pp3ppp/3ppn2/2p5/5P2/P2P4/NPP1P1PP/BQ1BNRKR w HFhf - 2 9
perft 1 21
perft 2 528
perft 3 12189
perft 4 326672
perft 5 8146062
perft 6 227689589

id 1
epd 2nnrbkr/p1qppppp/8/1ppb4/6PP/3PP3/PPP2P2/BQNNRBKR w HEhe - 1 9
perft 1 21
perft 2 807
perft 3 18002
perft 4 667366
perft 5 16253601
perft 6 590751109

id 2
epd b1q1rrkb/pppppppp/3nn3/8/P7/1PPP4/4PPPP/BQNNRKRB w GE - 1 9
perft 1 20
perft 2 479
perft 3 10471
perft 4 273318
perft 5 6417013
perft 6 177654692
`

type Perft = {
  id: string,
  epd: string,
  cases: [number, number][]
}

function parse_id(input: string): ParseResult<string> {
  let res = tuple([
    tag('id '),
    take_while(c => c != '\n')
  ])(input)

  if (is_success(res)) {
    let { value: [_, epd], rest } = res
    return { success: true, value: epd, rest }
  } else {
    return res
  }
}

function parse_epd(input: string): ParseResult<string> {
  let res = tuple([
    tag("epd "),
    take_while1(c => c != '\n')
  ])(input)

  if (is_success(res)) {
    return { success: true, value: res.value[1], rest: res.rest }
  } else {
    return res
  }
}

function parse_case(input: string): ParseResult<[number, number]> {
  let res = tuple([
    tag('perft '),
    unumber,
    tag(' '),
    unumber,
    newline
  ])(input)

  if (is_success(res)) {
    let { value: [_x, a, _y, b, _z], rest } = res

    return { success: true, value: [a, b], rest }
  } else {
    return res
  }
}

function parse_perft(input: string): ParseResult<Perft> {

  let res = tuple([
    parse_id,
    newline,
    parse_epd,
    newline,
    many1(parse_case),
    many0(ignored)
  ])(input)

  if (is_success(res)) {
     let { value: [id, _z, epd, _y, cases, _x], rest } = res

     return { success: true, value: { id, epd, cases }, rest }
  } else {
    return res
  }

}


function parse_comment(input: string): ParseResult<string> {
  let res = tuple([
    tag('#'),
    take_until('\n'),
    newline
  ])(input)

  if (is_success(res)) {
    return { success: true, value: res.value[1], rest: res.rest }
  } else {
    return res
  }
}

function ignored(input: string): ParseResult<string> {
  return alt(parse_comment, newline)(input)
}

function parse_perfts(input: string): ParseResult<Perft[]> {
  let _ = many0(ignored)(input)

  if (is_success(_)) {
    return many1(parse_perft)(_.rest)
  } else {
    return _
  }

}

it('works', () => {

  let perfts = parse_perfts(perft_case) 

  console.log(perfts)
  expect(is_success(perfts)).toBe(true)
  expect(perfts.rest).toBe('')
})