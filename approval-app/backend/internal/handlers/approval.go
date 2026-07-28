package handlers

import (
	"database/sql"
	"net/http"

	"approval-app/backend/internal/models"

	"github.com/gin-gonic/gin"
)

type ApprovalHandler struct {
	DB *sql.DB
}

func NewApprovalHandler(db *sql.DB) *ApprovalHandler {
	return &ApprovalHandler{DB: db}
}

func (h *ApprovalHandler) List(c *gin.Context) {
	status := c.Query("status")

	query := "SELECT id, title, status, memo, created_at, updated_at FROM approvals"
	args := []any{}
	if status != "" {
		query += " WHERE status = ?"
		args = append(args, status)
	}
	query += " ORDER BY id ASC"

	rows, err := h.DB.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	approvals := []models.Approval{}
	for rows.Next() {
		var a models.Approval
		if err := rows.Scan(&a.ID, &a.Title, &a.Status, &a.Memo, &a.CreatedAt, &a.UpdatedAt); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		approvals = append(approvals, a)
	}

	c.JSON(http.StatusOK, approvals)
}

type createRequest struct {
	Title string `json:"title" binding:"required,max=200"`
}

func (h *ApprovalHandler) Create(c *gin.Context) {
	var req createRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	res, err := h.DB.Exec(
		"INSERT INTO approvals (title, status, memo) VALUES (?, 'pending', '')",
		req.Title,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	id, _ := res.LastInsertId()
	var a models.Approval
	err = h.DB.QueryRow(
		"SELECT id, title, status, memo, created_at, updated_at FROM approvals WHERE id = ?", id,
	).Scan(&a.ID, &a.Title, &a.Status, &a.Memo, &a.CreatedAt, &a.UpdatedAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, a)
}

type updateRequest struct {
	Title string `json:"title" binding:"required,max=200"`
}

func (h *ApprovalHandler) Update(c *gin.Context) {
	id := c.Param("id")

	var req updateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	res, err := h.DB.Exec(
		"UPDATE approvals SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'pending'",
		req.Title, id,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	affected, _ := res.RowsAffected()
	if affected == 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "only pending items can be edited"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func (h *ApprovalHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	res, err := h.DB.Exec("DELETE FROM approvals WHERE id = ? AND status = 'pending'", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	affected, _ := res.RowsAffected()
	if affected == 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "only pending items can be deleted"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}

type bulkRequest struct {
	IDs  []int  `json:"ids" binding:"required"`
	Memo string `json:"memo" binding:"required,max=500"`
}

func (h *ApprovalHandler) bulkSetStatus(c *gin.Context, status string) {
	var req bulkRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if len(req.IDs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ids is required"})
		return
	}

	tx, err := h.DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	stmt, err := tx.Prepare(
		"UPDATE approvals SET status = ?, memo = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'pending'",
	)
	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer stmt.Close()

	for _, id := range req.IDs {
		if _, err := stmt.Exec(status, req.Memo, id); err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func (h *ApprovalHandler) Approve(c *gin.Context) {
	h.bulkSetStatus(c, "approved")
}

func (h *ApprovalHandler) Reject(c *gin.Context) {
	h.bulkSetStatus(c, "rejected")
}

type mockRow struct {
	title  string
	status string
	memo   string
}

var mockRows = []mockRow{
	{"ใบเบิกอุปกรณ์สำนักงาน ประจำเดือน", "pending", ""},
	{"ขออนุมัติจัดซื้อโน้ตบุ๊ก 5 เครื่อง", "pending", ""},
	{"ขออนุมัติค่าเดินทางไปประชุมต่างจังหวัด", "pending", ""},
	{"ขอเบิกค่าล่วงเวลาทีมพัฒนาระบบ", "pending", ""},
	{"ขออนุมัติต่อสัญญาบริการคลาวด์", "pending", ""},
	{"ขออนุมัติจ้างที่ปรึกษาด้านความปลอดภัย", "pending", ""},
	{"ขอเบิกค่าอบรมหลักสูตร Data Engineering", "pending", ""},
	{"ขออนุมัติจัดกิจกรรมสัมมนาประจำปี", "pending", ""},
	{"ขอเบิกค่ารับรองลูกค้า ไตรมาส 3", "pending", ""},
	{"ขออนุมัติซ่อมบำรุงเครื่องปรับอากาศ", "pending", ""},

	{"ขออนุมัติจัดซื้อเครื่องพิมพ์เอกสาร", "approved", "งบประมาณเพียงพอ อนุมัติตามที่เสนอ"},
	{"ขอเบิกค่าน้ำมันรถส่วนกลาง", "approved", "เอกสารครบถ้วน อนุมัติ"},
	{"ขออนุมัติต่ออายุ License ซอฟต์แวร์บัญชี", "approved", "จำเป็นต่อการดำเนินงาน อนุมัติ"},
	{"ขอเบิกค่าจัดส่งเอกสารสาขาภูมิภาค", "approved", "อยู่ในวงเงินที่กำหนด อนุมัติ"},
	{"ขออนุมัติจ้างพนักงานชั่วคราว 2 อัตรา", "approved", "ผ่านการพิจารณาจากฝ่ายบุคคล"},

	{"ขออนุมัติจัดซื้อรถตู้ประจำสำนักงาน", "rejected", "เกินกรอบงบประมาณประจำปี"},
	{"ขอเบิกค่าเลี้ยงรับรองนอกแผน", "rejected", "ไม่มีเอกสารประกอบการเบิกจ่าย"},
	{"ขออนุมัติปรับปรุงห้องประชุมชั้น 5", "rejected", "ให้ชะลอไว้ก่อนจนกว่าจะปิดงบไตรมาส"},
	{"ขออนุมัติจัดซื้อโทรศัพท์มือถือให้ทีมขาย", "rejected", "ให้ใช้อุปกรณ์เดิมที่มีอยู่ก่อน"},
	{"ขอเบิกค่าสมาชิกนิตยสารรายปี", "rejected", "ไม่เกี่ยวข้องกับงานโดยตรง"},
}

func (h *ApprovalHandler) Mock(c *gin.Context) {
	tx, err := h.DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if _, err := tx.Exec("DELETE FROM approvals"); err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// reset AUTOINCREMENT so seeded ids always start at 1
	if _, err := tx.Exec("DELETE FROM sqlite_sequence WHERE name = 'approvals'"); err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	stmt, err := tx.Prepare("INSERT INTO approvals (title, status, memo) VALUES (?, ?, ?)")
	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer stmt.Close()

	for _, r := range mockRows {
		if _, err := stmt.Exec(r.title, r.status, r.memo); err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true, "inserted": len(mockRows)})
}

func (h *ApprovalHandler) Cancel(c *gin.Context) {
	id := c.Param("id")

	res, err := h.DB.Exec(
		"UPDATE approvals SET status = 'pending', memo = '', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
		id,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	affected, _ := res.RowsAffected()
	if affected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}
