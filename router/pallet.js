const Router = require('express').Router();
const Books = require('./models/pallet')
const sequelize = require('../config/db')

Router.get('/test/:id',(req,res)=>{
	res.json({success: true, data: req.params.id }).status(200)
})

Router.get('/list', async (req,res)=>{
	sequelize.query(`SELECT 
		r.created,
		p.pallet_id,
		p.pallet_code,
		p.job_id,
		p.part_name,
		p.sig,
		CONCAT(out.sub_name,' ',out.zone_detail) as out_bound,
		CONCAT(inb.sub_name,' ',inb.zone_detail) as in_bound,
		DATEDIFF(minute,r.created,getdate()) as wait_time,
		CASE WHEN DATEDIFF(minute,p.created,getdate())>10 THEN 1 ELSE 0 END is_express
	FROM tb_pallet p
	LEFT JOIN tb_pallet_view v ON v.pallet_code=p.pallet_code
	LEFT JOIN tb_zone out ON out.zone_id = v.zone_id
	LEFT JOIN tb_zone inb ON inb.zone_id = v.next_zone_id
	LEFT JOIN tb_transfer_request r ON r.pallet_code=p.pallet_code
	WHERE p.status_id=2
		AND p.is_actived=1
		AND NOT EXISTS (
		SELECT pallet_code FROM tb_pallet_accept WHERE pallet_code=p.pallet_code
	)
	ORDER BY r.created ASC`)
	.then(([data]) => {
		res.json({success: true, data}).status(200)
	})
})


Router.get('/search_pallet/:pallet_code', async (req,res)=>{
	let pallet_code = req.params.pallet_code.trim();
	sequelize.query(`SELECT 
		r.created,
		p.pallet_id,
		p.pallet_code,
		p.job_id,
		p.part_name,
		p.sig,
		CONCAT(out.sub_name,' ',out.zone_detail) as out_bound,
		CONCAT(inb.sub_name,' ',inb.zone_detail) as in_bound,
		DATEDIFF(minute,r.created,getdate()) as wait_time,
		CASE WHEN DATEDIFF(minute,p.created,getdate())>10 THEN 1 ELSE 0 END is_express
	FROM tb_pallet p
	LEFT JOIN tb_pallet_view v ON v.pallet_code=p.pallet_code
	LEFT JOIN tb_zone out ON out.zone_id = v.zone_id
	LEFT JOIN tb_zone inb ON inb.zone_id = v.next_zone_id
	LEFT JOIN tb_transfer_request r ON r.pallet_code=p.pallet_code
	WHERE p.status_id IN (2)
		AND p.is_actived=1
		AND NOT EXISTS (
		SELECT pallet_code FROM tb_pallet_accept WHERE pallet_code=p.pallet_code
	)
	AND p.pallet_code LIKE '%${req.params.pallet_code}%'
	--AND out.sub_name IN (${req.params.zone})
	ORDER BY r.created ASC`)
	.then(([data]) => {
		//console.log(data)
		res.json({success: true, data}).status(200)
	}).catch(function (err) {
		console.log(err)
		res.json({success: false})
	});
})

Router.get('/search_job/:job_id/:zone/:forklift_outbound', async (req,res)=>{
	let job_id = req.params.job_id.trim();
	/*let sql = `SELECT 
		o.job_id,
		o.part_name,
		o.sig,
		CONCAT(out.sub_name,' ',out.zone_detail) as out_bound,
		o.amount,
		DATEDIFF(minute,o.updated,getdate()) as wait_time,
		o.order_code	
	FROM tb_transfer_order o
	LEFT JOIN tb_zone out ON out.zone_id = o.zone_id
	WHERE o.completed=0
		AND ( out.sub_name IN (${req.params.zone}) OR out.sub_name IN (${req.params.forklift_outbound}) )
		AND o.job_id LIKE '%${job_id}%'
	ORDER BY o.updated ASC`
	*/
	//console.log(sql)
	let sql =`
	
	;WITH order_cte AS (
		SELECT 
			o.job_id,
			o.part_name,
			o.sig,
			CONCAT(out.sub_name,' ',out.zone_detail) as out_bound,
			CONCAT(inb.sub_name,' ',inb.zone_detail) as in_bound,
			o.amount,
			DATEDIFF(minute,o.updated,getdate()) as wait_time,
			o.order_code,
			o.updated
		FROM tb_transfer_order o
		LEFT JOIN tb_zone out ON out.zone_id = o.zone_id
		LEFT JOIN tb_zone inb ON inb.zone_id = o.next_zone_id
		WHERE o.completed=0
			AND inb.sub_name IN (${req.params.zone})

		UNION ALL

		SELECT 
			o.job_id,
			o.part_name,
			o.sig,
			CONCAT(out.sub_name,' ',out.zone_detail) as out_bound,
			CONCAT(inb.sub_name,' ',inb.zone_detail) as in_bound,
			o.amount,
			DATEDIFF(minute,o.updated,getdate()) as wait_time,
			o.order_code,
			o.updated
		FROM tb_transfer_order o
		LEFT JOIN tb_zone out ON out.zone_id = o.zone_id
		LEFT JOIN tb_zone inb ON inb.zone_id = o.next_zone_id
		WHERE o.completed=0
			AND out.sub_name IN (${req.params.forklift_outbound})
			AND o.next_zone_id IN (14,15)
	)
	SELECT cte.*, mi.job_name
	FROM order_cte cte
	LEFT JOIN mi.dbo.mi ON mi.jobid = cte.job_id COLLATE Thai_CI_AI
	WHERE cte.job_id LIKE '%${job_id}%'
	ORDER BY cte.updated ASC`
	
	sequelize.query(sql)
	.then(([data]) => {
		console.log(data)
		res.json({success: true, data}).status(200)
	}).catch(function (err) {
		console.log(err)
		res.json({success: false})
	});
})

Router.get('/list_with_zone/:zone', async (req,res)=>{
	sequelize.query(`SELECT 
		r.created,
		p.pallet_id,
		p.pallet_code,
		p.job_id,
		p.part_name,
		p.sig,
		CONCAT(out.sub_name,' ',out.zone_detail) as out_bound,
		CONCAT(inb.sub_name,' ',inb.zone_detail) as in_bound,
		DATEDIFF(minute,r.created,getdate()) as wait_time,
		CASE WHEN DATEDIFF(minute,p.created,getdate())>10 THEN 1 ELSE 0 END is_express
	FROM tb_pallet p
	LEFT JOIN tb_pallet_view v ON v.pallet_code=p.pallet_code
	LEFT JOIN tb_zone out ON out.zone_id = v.zone_id
	LEFT JOIN tb_zone inb ON inb.zone_id = v.next_zone_id
	LEFT JOIN tb_transfer_request r ON r.pallet_code=p.pallet_code
	WHERE p.status_id=2
		AND p.is_actived=1
		AND NOT EXISTS (
		SELECT pallet_code FROM tb_pallet_accept WHERE pallet_code=p.pallet_code
	)
	AND out.sub_name IN (${req.params.zone})
	ORDER BY r.created DESC`)
	.then(([data]) => {
		//console.log(data)
		res.json({success: true, data}).status(200)
	}).catch(function (err) {
		console.log(err)
		res.json({success: false})
	});
})


Router.get('/get_order_with_zone/:zone/:forklift_outbound', async (req,res)=>{
	
	var sql = `;WITH order_cte AS (
		SELECT 
			o.job_id,
			o.part_name,
			CASE WHEN o.stock_type=0 THEN '-' ELSE CAST(o.sig as VARCHAR(2)) END as sig,
			CONCAT(out.sub_name,' ',out.zone_detail) as out_bound,
			CONCAT(inb.sub_name,' ',inb.zone_detail) as in_bound,
			o.amount,
			DATEDIFF(minute,o.updated,getdate()) as wait_time,
			o.order_code,
			o.updated
		FROM tb_transfer_order o
		LEFT JOIN tb_zone out ON out.zone_id = o.zone_id
		LEFT JOIN tb_zone inb ON inb.zone_id = o.next_zone_id
		WHERE o.completed=0
			AND inb.sub_name IN (${req.params.zone})

		UNION ALL

		SELECT 
			o.job_id,
			o.part_name,
			CASE WHEN o.stock_type=0 THEN '-' ELSE CAST(o.sig as VARCHAR(2)) END as sig,
			CONCAT(out.sub_name,' ',out.zone_detail) as out_bound,
			CONCAT(inb.sub_name,' ',inb.zone_detail) as in_bound,
			o.amount,
			DATEDIFF(minute,o.updated,getdate()) as wait_time,
			o.order_code,
			o.updated
		FROM tb_transfer_order o
		LEFT JOIN tb_zone out ON out.zone_id = o.zone_id
		LEFT JOIN tb_zone inb ON inb.zone_id = o.next_zone_id
		WHERE o.completed=0
			AND out.sub_name IN (${req.params.forklift_outbound})
			AND o.next_zone_id IN (14,15)
	)
	SELECT cte.*, mi.job_name
	FROM order_cte cte 
	LEFT JOIN mi.dbo.mi ON mi.jobid = cte.job_id COLLATE Thai_CI_AI
	ORDER BY cte.updated ASC`;
	
	console.log(sql)
	sequelize.query(sql)
	.then(([data]) => {
		//console.log(data)
		res.json({success: true, data}).status(200)
	}).catch(function (err) {
		console.log(err)
		res.json({success: false})
	});
})


Router.get('/get_order_with_section/:sub_name', async (req,res)=>{ // for tv
	let b = req.params.sub_name.split(',')
	let sub_name_arr = "'"+b.join("','")+"'"
	var sql = `;WITH order_cte AS (
				SELECT 
					o.job_id,
					o.part_name,
					CASE WHEN o.stock_type=0 THEN '-' ELSE CAST(o.sig as VARCHAR(2)) END as sig,
					out.sub_name as out_bound,
					inb.sub_name as in_bound,
					o.amount,
					DATEDIFF(minute,o.updated,getdate()) as wait_time,
					o.order_code,
					o.updated,
					o.machine_process,
					o.next_process,
					o.is_manual
				FROM tb_transfer_order o
				LEFT JOIN tb_zone out ON out.zone_id = o.zone_id
				LEFT JOIN tb_zone inb ON inb.zone_id = o.next_zone_id
				WHERE o.completed=0
					AND o.is_manual=1
					AND inb.sub_name IN (${sub_name_arr})

				UNION ALL

				SELECT 
					o.job_id,
					o.part_name,
					CASE WHEN o.stock_type=0 THEN '-' ELSE CAST(o.sig as VARCHAR(2)) END as sig,
					out.sub_name as out_bound,
					inb.sub_name as in_bound,
					o.amount,
					DATEDIFF(minute,o.updated,getdate()) as wait_time,
					o.order_code,
					o.updated,
					o.machine_process,
					o.next_process,
					o.is_manual
				FROM tb_transfer_order o
				LEFT JOIN tb_zone out ON out.zone_id = o.zone_id
				LEFT JOIN tb_zone inb ON inb.zone_id = o.next_zone_id
				WHERE o.completed=0
					AND o.is_manual=0
					AND inb.sub_name IN (${sub_name_arr})

				UNION ALL

				SELECT 
					o.job_id,
					o.part_name,
					CASE WHEN o.stock_type=0 THEN '-' ELSE CAST(o.sig as VARCHAR(2)) END as sig,
					out.sub_name as out_bound,
					inb.sub_name as in_bound,
					o.amount,
					DATEDIFF(minute,o.updated,getdate()) as wait_time,
					o.order_code,
					o.updated,
					o.machine_process,
					o.next_process,
					o.is_manual
				FROM tb_transfer_order o
				LEFT JOIN tb_zone out ON out.zone_id = o.zone_id
				LEFT JOIN tb_zone inb ON inb.zone_id = o.next_zone_id
				WHERE o.completed=0
					AND o.is_manual=0
					AND out.sub_name IN (${sub_name_arr})
					AND o.next_zone_id IN (14,15)
			)

			SELECT TOP 10 cte.*, mi.job_name
			FROM order_cte cte 
			LEFT JOIN mi.dbo.mi ON mi.jobid = cte.job_id COLLATE Thai_CI_AI
			ORDER BY cte.is_manual DESC,cte.updated ASC`;
	//console.log(sql)
	sequelize.query(sql)
	.then(([data]) => {
		res.json({success: true, data}).status(200)
	}).catch(function (err) {
		console.log(err)
		res.json({success: false})
	});
})

Router.get('/get_count_inbound_tv/:sub_name', async (req,res)=>{ // for tv
	let b = req.params.sub_name.split(',')
	let sub_name_arr = "'"+b.join("','")+"'"
	var sql = `SELECT p.job_id,
					COUNT(p.pallet_code) as count_pallet,
					z.sub_name
				FROM tb_pallet p
				LEFT JOIN tb_zone z ON z.zone_id = p.next_zone_id
				WHERE p.is_actived=1
					AND p.status_id IN (4)
					AND z.sub_name IN (${sub_name_arr})
				GROUP BY p.job_id, z.sub_name
				ORDER BY z.sub_name ASC, p.job_id ASC`;
	//console.log(sql)
	sequelize.query(sql)
	.then(([data]) => {
		res.json({success: true, data}).status(200)
	}).catch(function (err) {
		console.log(err)
		res.json({success: false})
	});
})

Router.get('/get_count_job_coming_tv/:sub_name', async (req,res)=>{ // for tv
	let b = req.params.sub_name.split(',')
	let sub_name_arr = "'"+b.join("','")+"'"
	var sql = `SELECT p.job_id,
					COUNT(p.pallet_code) as count_pallet,
					z.sub_name
				FROM tb_pallet p
				LEFT JOIN tb_zone z ON z.zone_id = p.next_zone_id
				WHERE p.is_actived=1
					AND p.status_id IN (1,2)
					AND z.sub_name IN (${sub_name_arr})
				GROUP BY p.job_id, z.sub_name
				ORDER BY z.sub_name ASC, p.job_id ASC`;
	//console.log(sql)
	sequelize.query(sql)
	.then(([data]) => {
		res.json({success: true, data}).status(200)
	}).catch(function (err) {
		console.log(err)
		res.json({success: false})
	});
})

Router.get('/get_count_pallet_in_zone/:sub_name', async (req,res)=>{ // for tv
	let b = req.params.sub_name.split(',')
	let sub_name_arr = "'"+b.join("','")+"'"
	var sql = `SELECT 
				z.sub_name,
				SUM(o.amount) total_pallet
			FROM tb_transfer_order o
			LEFT JOIN tb_zone z ON z.zone_id=o.next_zone_id
			WHERE o.completed=0
				AND z.zone_id NOT IN (16)
				--AND z.sub_name IN (${sub_name_arr})
			GROUP BY z.sub_name,z.zone_id
			ORDER BY z.zone_id ASC`;
	sequelize.query(sql)
	.then(([data]) => {
		res.json({success: true, data}).status(200)
	}).catch(function (err) {
		console.log(err)
		res.json({success: false})
	});
})

Router.get('/accept/:emp_id', async (req,res)=>{
	sequelize.query(`;with cte as (
		SELECT 
			p.pallet_id,
			p.pallet_code,
			p.job_id,
			p.part_name,
			p.sig,
			CONCAT(out.sub_name,' ',out.zone_detail) as out_bound,
			CONCAT(inb.sub_name,' ',inb.zone_detail) as in_bound,
			CASE WHEN p.status_id=2 THEN DATEDIFF(minute,a.created,getdate()) ELSE DATEDIFF(minute,t.created,getdate()) END wait_time,
			CASE WHEN DATEDIFF(minute,p.created,getdate())>10 THEN 1 ELSE 0 END is_express,
			CASE WHEN p.status_id=2 THEN 'รอย้ายออกจากต้นทาง' ELSE 'รอนำเช้าปลายทาง'  END status_name,
			p.status_id,
			CASE WHEN ISNULL(t.created, '')='' THEN a.created ELSE t.created END created
		FROM tb_pallet_accept a
		LEFT JOIN tb_pallet p ON p.pallet_code=a.pallet_code
		LEFT JOIN tb_pallet_view v ON v.pallet_code=p.pallet_code
		LEFT JOIN tb_zone out ON out.zone_id = v.zone_id
		LEFT JOIN tb_zone inb ON inb.zone_id = v.next_zone_id
		LEFT JOIN ( SELECT pallet_code,MAX(created) as created FROM tb_transfer_transaction GROUP BY pallet_code) t ON t.pallet_code=a.pallet_code
		WHERE p.status_id IN (1,2,3)
			AND p.is_actived=1
			AND a.emp_id='${req.params.emp_id}'
		)
		SELECT * FROM cte ORDER BY created ASC
		`)
	.then(([data]) => {
		res.json({success: true, data}).status(200)
	})
})

Router.get('/finish/:emp_id', async (req,res)=>{
	sequelize.query(`SELECT 
		p.pallet_id,
		p.pallet_code,
		p.job_id,
		p.part_name,
		p.sig,
		CONCAT(out.sub_name,' ',out.zone_detail) as out_bound,
		CONCAT(inb.sub_name,' ',inb.zone_detail) as in_bound,
		FORMAT(t.created,'dd/MM/yyyy HH:mm') as finish_time,
		CASE WHEN DATEDIFF(minute,t.created,getdate())>10 THEN 1 ELSE 0 END is_express,
		'ขนย้ายเสร็จสิ้น' AS status_name,
		p.status_id
	FROM tb_pallet p
	LEFT JOIN tb_pallet_view v ON v.pallet_code=p.pallet_code
	LEFT JOIN tb_zone out ON out.zone_id = v.zone_id
	LEFT JOIN tb_zone inb ON inb.zone_id = v.next_zone_id
	LEFT JOIN view_pallet_transaction_created t ON t.pallet_code=p.pallet_code
	WHERE p.status_id IN (4,5)
		AND p.is_actived=1
		AND t.emp_id='${req.params.emp_id}'
		AND FORMAT(t.created,'yyyy-MM-dd')=FORMAT(getdate(),'yyyy-MM-dd')
	ORDER BY t.created DESC`)
	.then(([data]) => {
		//console.log(data)
		res.json({success: true, data}).status(200)
	})
})


Router.post('/login', async (req,res)=>{
	
	sequelize.query(`
	SELECT u.emp_id,
		CONCAT(e.emp_firstname_th,' ',e.emp_lastname_th) as emp_name,
		f.zone_id,
		z.sub_name as zone_name,
		o.zone_id as forklift_outbound_zone_id,
		z2.sub_name as forklift_outbound_zone_name
	FROM tb_forklift_user u
	LEFT JOIN tb_zone_forklift f ON f.emp_id=u.emp_id
	LEFT JOIN tb_zone z ON z.zone_id=f.zone_id
	LEFT JOIN view_hrm_employee e ON e.emp_id = u.emp_id COLLATE Thai_CI_AI
	LEFT JOIN tb_forklift_outbound o ON o.emp_id = u.emp_id
	LEFT JOIN tb_zone z2 ON z2.zone_id=o.zone_id
		WHERE u.emp_id='${req.body.emp_id}'
		AND u.password='${req.body.password}'`)
	.then(([data]) => {
		if(data.length){
			var zone=[]
			var forklift_outbound_arr=[]
			data.forEach((item, index)=>{
				if(item.zone_id!=null && item.zone_name!=null){
					zone.push({
						zone_id: item.zone_id,
						zone_name: item.zone_name.toLowerCase()
					})
				}
				if(item.forklift_outbound_zone_id!=null && item.forklift_outbound_zone_name!=null){
					forklift_outbound_arr.push({
						zone_id: item.forklift_outbound_zone_id,
						zone_name: item.forklift_outbound_zone_name.toLowerCase()
					})
				}
			})
			
			const resp = {success: true, emp_id:data[0].emp_id, emp_name: data[0].emp_name, data:zone, forklift_outbound: forklift_outbound_arr}
			res.json(resp).status(200)
		}else{
			throw 500;
		}
	}).catch(function (err) {
		console.log(err)
		res.json({success: false})
	});
})




Router.get('/accept_pallet/:pallet_code/:emp_id', async (req,res)=>{
	//console.log(req.params.pallet_code)
	//console.log(req.params.emp_id)
	sequelize.query(`EXEC accept_pallet @pallet_code='${req.params.pallet_code}', @emp_id='${req.params.emp_id}'`)
	.then(([[data]]) => {
		if(data.success){
			res.json({success: true}).status(200)
		}else{
			throw 500;
		}
	}).catch(function (err) {
		res.json({success: false})
	});
})

Router.get('/scan/:pallet_code/:emp_id', async (req,res)=>{
	let palletCode = req.params.pallet_code.trim();
	palletCode=palletCode.substring(0, 11);
	sequelize.query(`EXEC insert_transfer_transaction @pallet_code='${palletCode}',@emp_id='${req.params.emp_id}'`)
	.then((data) => {
		//console.log(data)
		res.json({success: true}).status(200)
	}).catch(function (err) {
		res.json({success: false})
	});
})

Router.get('/scan_pallet_transfer/:order_code/:pallet_code/:emp_id', async (req,res)=>{
	let palletCode = req.params.pallet_code.trim();
	palletCode=palletCode.substring(0, 11);
	//console.log(req.params)
	var sql = `EXEC get_pallet_in_order @order_code='${req.params.order_code}',@pallet_code='${palletCode}',@emp_id='${req.params.emp_id}'`
	console.log(sql)
	sequelize.query(sql)
	.then(([[data]]) => {
		if(data.is_success==0){
			throw 'not success' 
		}
		req.app.io.emit('onRefresh', {message: 222});
		req.app.io.emit('onRefreshInbound', {message: 222});
		req.app.io.emit('onRefreshJobsComing', {message: 222});
		res.json({success: true, finish_transfer : data.finish_transfer?true:false}).status(200)
	}).catch(function (err) {
		res.json({success: false})
	});
})

Router.get('/add_transfer_transaction_worker/:pallet_code/:emp_id', async (req,res)=>{
	let palletCode = req.params.pallet_code.trim();
	sequelize.query(`EXEC add_transfer_transaction_worker @pallet_code='${palletCode}',@emp_id='${req.params.emp_id}'`)
	.then(([[data]]) => {
		req.app.io.emit('onRefreshInbound', {message: 222});
		res.json({...data}).status(200)
	}).catch(function (err) {
		res.json({success: false})
	});
})

module.exports = Router