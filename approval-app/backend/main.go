package main

import (
	"log"

	"approval-app/backend/internal/database"
	"approval-app/backend/internal/handlers"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	db, err := database.Connect("app.db")
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer db.Close()

	h := handlers.NewApprovalHandler(db)

	router := gin.Default()

	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:4200"}
	router.Use(cors.New(config))

	api := router.Group("/api")
	{
		api.GET("/approvals", h.List)
		api.POST("/approvals", h.Create)
		api.PUT("/approvals/:id", h.Update)
		api.DELETE("/approvals/:id", h.Delete)
		api.POST("/approvals/approve", h.Approve)
		api.POST("/approvals/reject", h.Reject)
		api.POST("/approvals/:id/cancel", h.Cancel)
		api.POST("/approvals/mock", h.Mock)
	}

	log.Println("listening on :8080")
	router.Run(":8080")
}
