import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class DbCheck {
    public static void main(String[] args) throws Exception {
        Connection conn = DriverManager.getConnection("jdbc:h2:mem:quickbite_dev;DB_CLOSE_DELAY=-1", "sa", "");
        Statement stmt = conn.createStatement();
        ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM restaurant");
        if (rs.next()) {
            System.out.println("Total Restaurants: " + rs.getInt(1));
        }
    }
}
