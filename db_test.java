import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class db_test {
    public static void main(String[] args) throws Exception {
        Connection conn = DriverManager.getConnection("jdbc:h2:mem:quickbitedb;DB_CLOSE_DELAY=-1", "sa", "");
        Statement stmt = conn.createStatement();
        ResultSet rs = stmt.executeQuery("SELECT * FROM DELIVERY_STATUS_HISTORY");
        while (rs.next()) {
            System.out.println("History ID: " + rs.getLong("id") + ", Delivery: " + rs.getLong("delivery_id") + ", Prev: " + rs.getString("previous_status") + ", New: " + rs.getString("new_status") + ", Role: " + rs.getString("user_role"));
        }
    }
}
