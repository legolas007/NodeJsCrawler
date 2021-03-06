let rp = require('request-promise')
let cheerio = require('cheerio')
let htmlDecode = require('./htmlDecode')
let MongoClient = require('mongodb').MongoClient

async function getQuestion(db,id) {
    let res = await rp(`https://www.zhihu.com/question/${id}`)//模板字符串
    let $ = cheerio.load(res)
    let data = $('#data').attr('data-state')
    let state = JSON.parse(htmlDecode(data))
    let question = state.entities.questions[id]
    console.log(question)
    db.collection('question').insert(question)
    await getAnswers(db, id, question.answerCount)
}

async function getAnswers(db,id, answerCount) {
    for(let offset = 0;offset < answerCount;offset+=20){
        let res = await rp({
            url:`https://www.zhihu.com/api/v4/questions/${id}/answers?sort_by=default&include=data%5B%2A%5D.is_normal%2Cadmin_closed_comment%2Creward_info%2Cis_collapsed%2Cannotation_action%2Cannotation_detail%2Ccollapse_reason%2Cis_sticky%2Ccollapsed_by%2Csuggest_edit%2Ccomment_count%2Ccan_comment%2Ccontent%2Ceditable_content%2Cvoteup_count%2Creshipment_settings%2Ccomment_permission%2Ccreated_time%2Cupdated_time%2Creview_info%2Cquestion%2Cexcerpt%2Crelationship.is_authorized%2Cis_author%2Cvoting%2Cis_thanked%2Cis_nothelp%2Cupvoted_followees%3Bdata%5B%2A%5D.mark_infos%5B%2A%5D.url%3Bdata%5B%2A%5D.author.follower_count%2Cbadge%5B%3F%28type%3Dbest_answerer%29%5D.topics&limit=20&offset=${offset}`,
            headers:{
                authorization:"oauth c3cef7c66a1843f8b3a9e6a1e3160e20"
            }
        })
        let data = JSON.parse(res)
        let answers = data.data
        console.log(answers)
        db.collection("answers").insertMany(answers)
    }
    db.close()
}
async function main() {
    let id = 28560777
    let url = 'mongodb://localhost:27017/zhihu_data'
    let db = await MongoClient.connect(url)
    await getQuestion(db, id)
}
main()
